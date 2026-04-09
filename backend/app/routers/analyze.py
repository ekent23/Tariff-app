from fastapi import APIRouter, UploadFile, File, Depends, Form
import csv
from io import StringIO
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services import csv_service, usitc_service, risk_engine, ollama_service
from app.services.tariff_service import get_tariff_rate  # ← NEW: live USITC integration
from app.models import Product
from app.schemas import ProductResult
from typing import List

router = APIRouter()

def _clean(value: str) -> str:
    return value.replace("\x00", "").replace("\r", " ").strip()

@router.post("/analyze", response_model=List[ProductResult])
async def analyze(
    file: UploadFile = File(...),
    focus: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    contents = await file.read()
    rows = csv_service.parse_csv(contents)
    results = []

    for row in rows:
        # ── NEW: fetch live tariff rate from USITC ────────────────────────
        live_tariff = await get_tariff_rate(row["hts_code"])
        live_rate = live_tariff.get("general_rate") if not live_tariff.get("error") else None
        # ─────────────────────────────────────────────────────────────────

        # Your existing USITC service call (kept as fallback)
        tariff = await usitc_service.get_tariff_rate(row["hts_code"], row["origin_country"])

        # Use live rate if available, otherwise fall back to your existing service
        effective_rate = live_rate or tariff
        duty_exposure = row["annual_spend"] * effective_rate

        score = risk_engine.calculate_risk(row["origin_country"], effective_rate, row["annual_spend"])

        # Pass live tariff description to Claude so it reasons over real data
        extra_context = (
            f"Current MFN tariff rate: {live_rate}. Description: {live_tariff.get('description', 'N/A')}"
            if live_rate else None
        )
        if focus:
            extra_context = (
                f"{extra_context}\nUser focus: {focus}"
                if extra_context
                else f"User focus: {focus}"
            )

        advice = await ollama_service.get_ai_advice(
            row["name"],
            score,
            row["origin_country"],
            extra_context=extra_context,
        )

        product = Product(
            name=row["name"],
            hts_code=row["hts_code"],
            origin_country=row["origin_country"],
            annual_spend=row["annual_spend"],
            risk_score=score,
            ai_advice=advice
        )
        db.add(product)
        results.append(
            ProductResult(
                **row,
                risk_score=score,
                ai_advice=advice,
                tariff_rate=effective_rate,
                duty_exposure=round(duty_exposure, 2),
            )
        )

    await db.commit()
    return results

@router.post("/analyze-csv")
async def analyze_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\x00", "")
    reader = csv.DictReader(StringIO(text))
    rows = list(reader)

    if not rows:
        return {"products": [], "country_breakdown": [], "summary": {}}

    risk_countries = {"CN": 80, "RU": 90, "IR": 95, "KP": 98, "BY": 85}
    tariff_rates = {
        "CN": 1.45,
        "RU": 0.35,
        "IR": 0.40,
        "KP": 0.45,
        "MX": 0.25,
        "CA": 0.25,
        "TW": 0.05,
        "VN": 0.12,
        "IN": 0.10,
        "BR": 0.03,
        "DE": 0.20,
        "JP": 0.03,
    }

    products = []
    for row in rows:
        name = row.get("name", row.get("product", "Unknown"))
        country = row.get("origin_country", row.get("country", "US")).upper().strip()
        try:
            spend = float(row.get("annual_spend", row.get("spend", 0)))
        except Exception:
            spend = 0

        tariff_rate = tariff_rates.get(country, 0.035)
        base_risk = risk_countries.get(country, 20)
        spend_risk = 20 if spend > 500000 else 10 if spend > 100000 else 5
        tariff_risk = 30 if tariff_rate >= 0.25 else 15 if tariff_rate >= 0.10 else 0
        risk_score = min(base_risk + spend_risk + tariff_risk, 100)
        duty_exposure = spend * tariff_rate

        products.append({
            "name": _clean(str(name)),
            "country": country,
            "annual_spend": spend,
            "tariff_rate": tariff_rate,
            "risk_score": risk_score,
            "duty_exposure": round(duty_exposure, 2),
        })

    products.sort(key=lambda x: x["risk_score"], reverse=True)

    country_exposure = {}
    for p in products:
        c = p["country"]
        if c not in country_exposure:
            country_exposure[c] = {"country": c, "spend": 0, "duty": 0, "count": 0}
        country_exposure[c]["spend"] += p["annual_spend"]
        country_exposure[c]["duty"] += p["duty_exposure"]
        country_exposure[c]["count"] += 1

    total_spend = sum(p["annual_spend"] for p in products)
    total_duty = sum(p["duty_exposure"] for p in products)
    critical = len([p for p in products if p["risk_score"] >= 75])

    return {
        "products": products,
        "country_breakdown": list(country_exposure.values()),
        "summary": {
            "total_products": len(products),
            "total_spend": round(total_spend, 2),
            "total_duty_exposure": round(total_duty, 2),
            "critical_count": critical,
            "avg_risk_score": round(
                sum(p["risk_score"] for p in products) / len(products), 1
            ),
        },
    }
