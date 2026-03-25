from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import engine, Base
from app.routers import analyze, simulate

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="TradeShield API", lifespan=lifespan)
app.include_router(analyze.router)
app.include_router(simulate.router)