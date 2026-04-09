from pydantic import BaseModel
from typing import Optional

class ProductResult(BaseModel):
    name: str
    hts_code: str
    origin_country: str
    annual_spend: float
    risk_score: float
    tariff_rate: float
    duty_exposure: float
    ai_advice: Optional[str] = None

class SimulateRequest(BaseModel):
    hts_code: str
    origin_country: str
    annual_spend: float
    tariff_rate: float

class SimulateResult(BaseModel):
    original_cost: float
    new_cost: float
    impact: float
    risk_score: float
