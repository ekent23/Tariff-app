HIGH_RISK_COUNTRIES = {"CN", "RU", "IR", "KP"}

def calculate_risk(origin_country: str, tariff_rate: float, annual_spend: float) -> float:
    score = 0.0

    if origin_country.upper() in HIGH_RISK_COUNTRIES:
        score += 40

    if tariff_rate >= 0.25:
        score += 30

    if annual_spend > 500_000:
        score += 20
    elif annual_spend > 100_000:
        score += 10

    return min(score, 100.0)