import csv
import io
from typing import List, Dict

COLUMN_ALIASES = {
    "product": "name", "item": "name",
    "hs_code": "hts_code", "hs": "hts_code",
    "country": "origin_country",
    "spend": "annual_spend", "cost": "annual_spend",
}

def parse_csv(contents: bytes) -> List[Dict]:
    decoded = contents.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    rows = []
    for row in reader:
        normalized = {
            COLUMN_ALIASES.get(k.lower(), k.lower()): v
            for k, v in row.items()
        }
        if "name" in normalized and "hts_code" in normalized:
            normalized["annual_spend"] = float(normalized.get("annual_spend", 0))
            rows.append(normalized)
    return rows