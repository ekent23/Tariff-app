
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    prompt: str
    history: list[dict] = []

class AnalyzeResponse(BaseModel):
    analysis: str
    keyRisks: list[str]
    nextSteps: list[str]

app = FastAPI()  # This 'app' is what uvicorn is looking for!

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello World"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    prompt = request.prompt.strip()
    summary = (
        "Preliminary tariff exposure analysis: "
        f"Your scenario highlights elevated duty risk tied to {prompt[:120] or 'the provided inputs'}. "
        "Key cost pressure is concentrated in high-volume SKUs and single-source suppliers. "
        "Recommended mitigation: validate HS codes, model alternate country-of-origin sourcing, "
        "and prioritize renegotiation on the top three exposure lanes."
    )
    return AnalyzeResponse(
        analysis=summary,
        keyRisks=[
            "High duty exposure concentrated in a small set of SKUs",
            "Supplier concentration risk across top import lanes",
            "Potential margin erosion if proposed rates take effect",
        ],
        nextSteps=[
            "Run HS reclassification check on top 10 SKUs",
            "Simulate alternative sourcing from lower-duty origins",
            "Review supplier contracts for tariff pass-through clauses",
        ],
    )
