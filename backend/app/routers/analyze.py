from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services import csv_service, usitc_service, risk_engine, ollama_service
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
        tariff = await usitc_service.get_tariff_rate(row["hts_code"], row["origin_country"])
        score = risk_engine.calculate_risk(row["origin_country"], tariff, row["annual_spend"])
        advice = await ollama_service.get_ai_advice(row["name"], score, row["origin_country"])

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