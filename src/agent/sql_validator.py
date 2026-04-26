import re

# Match whole SQL keywords only — substring checks falsely reject identifiers like
# CREATED_AT (contains "CREATE"), LAST_UPDATE (contains "UPDATE"), REPLACE() (contains "REPLACE").
_FORBIDDEN_KEYWORD_PATTERNS = [
    r"\bINSERT\b",
    r"\bUPDATE\b",
    r"\bDELETE\b",
    r"\bDROP\b",
    r"\bALTER\b",
    r"\bTRUNCATE\b",
    r"\bCREATE\b",
]

# SQLite REPLACE INTO … is write-like; do not ban REPLACE() scalar function.
_REPLACE_INTO = re.compile(r"\bREPLACE\s+INTO\b", re.IGNORECASE)

ALLOWED_TABLES = [
    "orders",
    "customers",
    "items",
    "payments",
    "reviews",
    "sellers",
    "products",
    "geolocation",
    "category_translation",
]


def validate_query(query: str) -> bool:
    text = query.strip()
    query_upper = text.upper()

    if not query_upper.startswith("SELECT"):
        return False

    for pattern in _FORBIDDEN_KEYWORD_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return False

    if _REPLACE_INTO.search(text):
        return False

    # Normalize whitespace so "FROM\norders" still matches table checks
    normalized = re.sub(r"\s+", " ", text.lower())

    if " from " in normalized:
        table_found = False
        for table in ALLOWED_TABLES:
            if f" from {table}" in normalized or f" join {table}" in normalized:
                table_found = True
                break
        if not table_found:
            return False

    return True
