import httpx
import os
from dotenv import load_dotenv
load_dotenv()

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

async def get_ai_advice(product_name: str, risk_score: float, country: str, extra_context: str = None) -> str:
    
    # Inject live tariff data into the prompt if available
    live_tariff_section = f"\nLIVE TARIFF DATA (fetched today from USITC):\n{extra_context}\n" if extra_context else ""

    prompt = f"""You are a senior supply chain risk analyst writing a professional briefing in 2026.
Product: {product_name}
Source Country: {country}
Risk Score: {risk_score}/100
{live_tariff_section}
Write a clean, professional risk briefing using plain text only. No markdown, no asterisks, no hashtags. Use numbered sections and normal punctuation only.
Format it exactly like this:
RISK LEVEL: [Critical/High/Medium/Low] ({risk_score}/100)
SITUATION: Write 2 sentences explaining the current trade situation for this product from this country in 2026, referencing real current tariffs and geopolitical context.
TARIFF BREAKDOWN:
- Current rate: X%
- Potential rate under escalation: X%
- Annual cost impact on {product_name} spend: $X
TOP 3 ALTERNATIVE SUPPLIERS:
1. [Country] - [X]% tariff - [One sentence on why its better and any trade agreement]
2. [Country] - [X]% tariff - [One sentence on why its better and any trade agreement]
3. [Country] - [X]% tariff - [One sentence on why its better and any trade agreement]
RECOMMENDED ACTION: One clear, specific action this business should take in the next 90 days with expected savings or risk reduction.
Use real 2026 trade data. Be specific and accurate. Plain text only, no special characters."""

    headers = {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": API_KEY,
    }
    payload = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 1000,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                CLAUDE_API_URL,
                headers=headers,
                json=payload,
                timeout=30.0
            )
            data = resp.json()
            if "error" in data:
                return f"API Error: {data['error']['message']}"
            return data["content"][0]["text"]
    except Exception as e:
        return f"AI advice unavailable: {str(e)}"
