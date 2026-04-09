import csv
import io
from typing import List, Dict

COLUMN_ALIASES = {
    "product": "name",
    "item": "name",
    "hs_code": "hts_code",
    "hs": "hts_code",
    "hts": "hts_code",
    "hts_code": "hts_code",
    "hts_code_number": "hts_code",
    "country": "origin_country",
    "origin": "origin_country",
    "origin_country": "origin_country",
    "spend": "annual_spend",
    "cost": "annual_spend",
    "annual_spend": "annual_spend",
}

def _normalize_key(key: str) -> str:
    cleaned = (
        key.strip()
        .lower()
        .replace("/", "_")
        .replace("-", "_")
        .replace("(", "")
        .replace(")", "")
    )
    cleaned = "_".join([part for part in cleaned.split() if part])
    cleaned = cleaned.replace("__", "_")
    return cleaned

def parse_csv(contents: bytes) -> List[Dict]:
    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        decoded = contents.decode("latin-1")
    decoded = decoded.replace("\r\n", "\n").replace("\r", "\n").replace("\x00", "")
    reader = csv.DictReader(io.StringIO(decoded))
    rows = []
    for row in reader:
        normalized = {}
        for k, v in row.items():
            if k is None:
                continue
            base_key = _normalize_key(k)
            key = COLUMN_ALIASES.get(base_key, base_key)
            normalized[key] = v.strip() if isinstance(v, str) else v
        if "name" in normalized and "hts_code" in normalized:
            try:
                normalized["annual_spend"] = float(
                    normalized.get("annual_spend", 0) or 0
                )
            except Exception:
                normalized["annual_spend"] = 0.0
            rows.append(normalized)
    return rows
