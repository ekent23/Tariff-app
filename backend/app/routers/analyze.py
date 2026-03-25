from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services import csv_service, usitc_service, risk_engine, ollama_service
from app.services.tariff_service import get_tariff_rate  # ← NEW: live USITC integration
from app.models import Product
from app.schemas import ProductResult
from typing import List

router = APIRouter()

@router.post("/analyze", response_model=List[ProductResult])
async def analyze(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
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

        score = risk_engine.calculate_risk(row["origin_country"], effective_rate, row["annual_spend"])

        # Pass live tariff description to Claude so it reasons over real data
        advice = await ollama_service.get_ai_advice(
            row["name"],
            score,
            row["origin_country"],
            extra_context=f"Current MFN tariff rate: {live_rate}. Description: {live_tariff.get('description', 'N/A')}"
            if live_rate else None
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
        results.append(ProductResult(**row, risk_score=score, ai_advice=advice))

    await db.commit()
    return results
