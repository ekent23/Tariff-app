"""
tariff_service.py
-----------------
Live tariff data integration for TradeShield.
Fetches current HTS rates from the USITC HTS REST API (hts.usitc.gov).

Drop this file into: app/services/tariff_service.py
"""

import httpx
import asyncio
from typing import Optional
from datetime import datetime, timedelta
import json
import os

# ── Cache settings ────────────────────────────────────────────────────────────
# Tariff rates don't change by the minute, so we cache results for 24 hours
# to avoid hammering the USITC API on every request.
_cache: dict = {}
CACHE_TTL_HOURS = 24

# ── USITC HTS API base URL ────────────────────────────────────────────────────
HTS_API_BASE = "https://hts.usitc.gov/reststop/api"


# ── Main function: look up a single HTS code ─────────────────────────────────

async def get_tariff_rate(hts_code: str) -> dict:
    """
    Look up live tariff data for a given HTS code.

    Args:
        hts_code: HTS number e.g. "8471.30.01" or "8471300100"

    Returns:
        {
            "hts_code": "8471.30.01",
            "description": "...",
            "general_rate": "Free",       # MFN / Column 1 General rate
            "special_rate": "Free",       # GSP / USMCA / etc.
            "column2_rate": "35%",        # Non-market economy rate
            "units": "No.",
            "source": "USITC HTS API",
            "fetched_at": "2026-03-25T16:00:00",
            "error": None                 # populated if lookup failed
        }
    """
    # Normalize HTS code (remove dots and spaces)
    clean_code = hts_code.replace(".", "").replace(" ", "").strip()

    # Return cached result if still fresh
    if clean_code in _cache:
        cached = _cache[clean_code]
        if datetime.now() - cached["_cached_at"] < timedelta(hours=CACHE_TTL_HOURS):
            return cached["data"]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{HTS_API_BASE}/details/htsno/{clean_code}"
            )
            response.raise_for_status()
            raw = response.json()

        # Parse the USITC response format
        result = _parse_hts_response(hts_code, raw)

    except httpx.HTTPStatusError as e:
        result = _error_result(hts_code, f"USITC API returned {e.response.status_code}")
    except httpx.RequestError as e:
        result = _error_result(hts_code, f"Network error: {str(e)}")
    except Exception as e:
        result = _error_result(hts_code, f"Unexpected error: {str(e)}")

    # Store in cache
    _cache[clean_code] = {
        "_cached_at": datetime.now(),
        "data": result
    }
    return result


async def get_tariff_rates_bulk(hts_codes: list[str]) -> list[dict]:
    """
    Look up tariff data for multiple HTS codes concurrently.
    Use this for CSV uploads with many products.

    Args:
        hts_codes: list of HTS code strings

    Returns:
        List of tariff result dicts (same format as get_tariff_rate)
    """
    tasks = [get_tariff_rate(code) for code in hts_codes]
    results = await asyncio.gather(*tasks)
    return list(results)


# ── Response parser ───────────────────────────────────────────────────────────

def _parse_hts_response(original_code: str, raw: dict) -> dict:
    """
    Map USITC API response fields to our internal format.
    USITC returns nested objects — we flatten what we need.
    """
    # USITC nests the data under a 'tariffData' or similar key
    # The actual field names depend on the API version — we handle both
    data = raw if isinstance(raw, dict) else {}

    # Try common field names the USITC API uses
    description = (
        data.get("description") or
        data.get("briefDescription") or
        data.get("htsDescription") or
        "N/A"
    )

    # Rates are often nested under 'rates' or at root level
    rates = data.get("rates", data)

    general_rate = (
        rates.get("generalRateOfDuty") or
        rates.get("general") or
        rates.get("col1General") or
        "See USITC"
    )

    special_rate = (
        rates.get("specialRateOfDuty") or
        rates.get("special") or
        "See USITC"
    )

    column2_rate = (
        rates.get("col2RateOfDuty") or
        rates.get("column2") or
        rates.get("col2") or
        "See USITC"
    )

    units = data.get("units") or data.get("unitOfQuantity") or "N/A"

    return {
        "hts_code": original_code,
        "description": description,
        "general_rate": general_rate,
        "special_rate": special_rate,
        "column2_rate": column2_rate,
        "units": units,
        "source": "USITC HTS API",
        "fetched_at": datetime.now().isoformat(),
        "error": None
    }


def _error_result(hts_code: str, error_msg: str) -> dict:
    """Return a consistent error structure so callers always get the same shape."""
    return {
        "hts_code": hts_code,
        "description": None,
        "general_rate": None,
        "special_rate": None,
        "column2_rate": None,
        "units": None,
        "source": "USITC HTS API",
        "fetched_at": datetime.now().isoformat(),
        "error": error_msg
    }


# ── Enrich Claude prompt with live tariff data ────────────────────────────────

async def build_tariff_context(hts_codes: list[str]) -> str:
    """
    Fetch live tariff rates for a list of HTS codes and return a
    formatted string you can inject directly into a Claude API prompt.

    Usage in your analyze.py router:
        context = await build_tariff_context(hts_codes_from_csv)
        prompt = f"{context}\n\nNow analyze risk for these products..."

    Args:
        hts_codes: list of HTS codes from the user's CSV

    Returns:
        A formatted string with current tariff info for Claude to reason over
    """
    rates = await get_tariff_rates_bulk(hts_codes)

    lines = ["CURRENT TARIFF RATES (live from USITC, fetched today):"]
    lines.append("-" * 60)

    for r in rates:
        if r["error"]:
            lines.append(f"HTS {r['hts_code']}: ⚠️  Could not retrieve ({r['error']})")
        else:
            lines.append(
                f"HTS {r['hts_code']}: {r['description']}\n"
                f"  General (MFN) Rate : {r['general_rate']}\n"
                f"  Special Rate       : {r['special_rate']}\n"
                f"  Column 2 Rate      : {r['column2_rate']}\n"
                f"  Fetched at         : {r['fetched_at']}"
            )
        lines.append("")

    return "\n".join(lines)


# ── Quick test (run directly: python tariff_service.py) ──────────────────────

if __name__ == "__main__":
    async def test():
        print("Testing USITC live tariff lookup...\n")

        # Test with a common electronics HTS code
        test_codes = ["8471.30.01", "6110.20.20", "8517.12.00"]
        context = await build_tariff_context(test_codes)
        print(context)

    asyncio.run(test())
