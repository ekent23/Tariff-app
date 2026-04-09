<<<<<<< Updated upstream

from app.main import app
=======
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import csv
from io import StringIO
import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class AnalyzeRequest(BaseModel):
    prompt: str
    history: list[dict] = []

class AnalyzeResponse(BaseModel):
    analysis: str
    keyRisks: list[str]
    nextSteps: list[str]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = """You are a senior trade compliance and supply chain risk analyst with 20 years of experience. 
You advise Fortune 500 procurement teams on tariff exposure, sourcing strategy, and trade policy risk.

Your communication style:
- Direct and professional, like a trusted advisor — not a chatbot
- Use specific numbers, percentages, and dollar figures when possible
- Reference real trade policies: Section 301, Section 232, IEEPA, USMCA, CPTPP, GSP
- Never use filler phrases like "Great question" or "Certainly"
- Keep responses concise but substantive — 3 to 5 sentences per section
- Always end with one clear, specific action the client should take this week

Current context (April 2026):
- US-China tariffs are at 145% under IEEPA escalation
- China has retaliated with 125% tariffs on US goods
- 25% tariffs apply to Canada and Mexico imports
- EU faces 20% baseline tariffs with a 90-day negotiation pause
- Section 232 steel and aluminum tariffs remain at 25% and 10%
- Vietnam, India, and Mexico are the primary China alternatives"""


def clean(text: str) -> str:
    return text.replace('\x00', '').replace('\r', ' ').strip()


def build_messages(prompt: str, history: list[dict]) -> list[dict]:
    messages = []
    for msg in history[-6:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({
                "role": msg["role"],
                "content": clean(str(msg["content"]))
            })
    messages.append({"role": "user", "content": clean(prompt)})
    return messages


@app.get("/")
def root():
    return {"message": "TradeShield API is running"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    return run_analysis(request.prompt, request.history)


@app.post("/chat")
def chat(request: AnalyzeRequest):
    return run_analysis(request.prompt, request.history)


def run_analysis(prompt: str, history: list[dict]) -> AnalyzeResponse:
    try:
        messages = build_messages(prompt, history)

        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages,
        )

        full_text = clean(response.content[0].text)

        risks_prompt = (
            f"Based on this analysis: {full_text[:300]}\n\n"
            "List exactly 3 key risks as short phrases, one per line, no bullets or numbers."
        )
        risks_response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=200,
            messages=[{"role": "user", "content": risks_prompt}],
        )
        risks_raw = clean(risks_response.content[0].text)
        risks = [clean(r) for r in risks_raw.split("\n") if r.strip()][:3]

        steps_prompt = (
            f"Based on this analysis: {full_text[:300]}\n\n"
            "List exactly 3 specific next steps the client should take, one per line, no bullets or numbers."
        )
        steps_response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=200,
            messages=[{"role": "user", "content": steps_prompt}],
        )
        steps_raw = clean(steps_response.content[0].text)
        steps = [clean(s) for s in steps_raw.split("\n") if s.strip()][:3]

        if len(risks) < 3:
            risks += ["Monitor tariff policy changes weekly"] * (3 - len(risks))
        if len(steps) < 3:
            steps += ["Schedule a supply chain review with your team"] * (3 - len(steps))

        return AnalyzeResponse(
            analysis=full_text,
            keyRisks=risks,
            nextSteps=steps,
        )

    except Exception as e:
        print(f"Claude API error: {e}")
        return AnalyzeResponse(
            analysis=clean(
                f"Analysis unavailable at this time. Please check your API configuration. Error: {str(e)[:100]}"
            ),
            keyRisks=[
                "Unable to complete risk analysis",
                "Check API key configuration",
                "Retry the analysis",
            ],
            nextSteps=[
                "Verify your Anthropic API key is set correctly",
                "Check the backend terminal for error details",
                "Try again in a few moments",
            ],
        )


@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    text = text.replace('\r\n', '\n').replace('\r', '\n').replace('\x00', '')

    reader = csv.reader(StringIO(text))
    rows = list(reader)
    if not rows:
        return {"message": "Empty CSV", "rows": 0, "columns": []}

    header = rows[0]
    data_rows = rows[1:]
    sample = data_rows[:5]

    return {
        "message": f"Loaded {len(data_rows)} products across {len(header)} columns: {', '.join(header)}. Ready for analysis.",
        "rows": len(data_rows),
        "columns": header,
        "sample": sample,
    }
@app.post("/analyze-csv")
async def analyze_csv(file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    text = text.replace('\r\n', '\n').replace('\r', '\n').replace('\x00', '')
    reader = csv.DictReader(StringIO(text))
    rows = list(reader)

    if not rows:
        return {"products": [], "summary": {}}

    RISK_COUNTRIES = {"CN": 80, "RU": 90, "IR": 95, "KP": 98, "BY": 85}
    TARIFF_RATES = {
        "CN": 1.45, "RU": 0.35, "IR": 0.40, "KP": 0.45,
        "MX": 0.25, "CA": 0.25, "TW": 0.05, "VN": 0.12,
        "IN": 0.10, "BR": 0.03, "DE": 0.20, "JP": 0.03,
    }

    products = []
    for row in rows:
        name = row.get("name", row.get("product", "Unknown"))
        country = row.get("origin_country", row.get("country", "US")).upper().strip()
        try:
            spend = float(row.get("annual_spend", row.get("spend", 0)))
        except Exception:
            spend = 0

        tariff_rate = TARIFF_RATES.get(country, 0.035)
        base_risk = RISK_COUNTRIES.get(country, 20)
        spend_risk = 20 if spend > 500000 else 10 if spend > 100000 else 5
        tariff_risk = 30 if tariff_rate >= 0.25 else 15 if tariff_rate >= 0.10 else 0
        risk_score = min(base_risk + spend_risk + tariff_risk, 100)
        duty_exposure = spend * tariff_rate

        products.append({
            "name": clean(name),
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
            "avg_risk_score": round(sum(p["risk_score"] for p in products) / len(products), 1),
        }
    }
>>>>>>> Stashed changes
