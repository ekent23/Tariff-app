from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    hts_code = Column(String)
    origin_country = Column(String)
    annual_spend = Column(Float)
    risk_score = Column(Float)
    ai_advice = Column(String)
    created_at = Column(DateTime, server_default=func.now())