from fastapi import APIRouter
from app.schemas import SimulateRequest, SimulateResult
from app.services import usitc_service, risk_engine

router = APIRouter()

@router.post("/simulate", response_model=SimulateResult)
async def simulate(req: SimulateRequest):
    current_tariff = await usitc_service.get_tariff_rate(req.hts_code, req.origin_country)
    original_cost = req.annual_spend * (1 + current_tariff)
    new_cost = req.annual_spend * (1 + req.tariff_rate)
    score = risk_engine.calculate_risk(req.origin_country, req.tariff_rate, req.annual_spend)

    return SimulateResult(
        original_cost=round(original_cost, 2),
        new_cost=round(new_cost, 2),
        impact=round(new_cost - original_cost, 2),
        risk_score=score
    )