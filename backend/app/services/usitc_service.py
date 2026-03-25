
_cache: dict = {}

# Realistic default tariff rates by country
DEFAULT_RATES = {
    "CN": 0.25,
    "RU": 0.35,
    "IR": 0.40,
    "KP": 0.45,
    "TW": 0.05,
    "BR": 0.03,
    "BD": 0.12,
}

async def get_tariff_rate(hts_code: str, country: str) -> float:
    key = f"{hts_code}:{country}"
    if key in _cache:
        return _cache[key]

    rate = DEFAULT_RATES.get(country.upper(), 0.05)
    _cache[key] = rate
    return rate