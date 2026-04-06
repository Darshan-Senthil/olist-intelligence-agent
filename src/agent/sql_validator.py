FORBIDDEN_KEYWORDS = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "REPLACE",
]

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
    query_upper = query.upper().strip()

    if not query_upper.startswith("SELECT"):
        return False

    for keyword in FORBIDDEN_KEYWORDS:
        if keyword in query_upper:
            return False

    query_lower = query.lower()

    if " from " in query_lower:
        table_found = False
        for table in ALLOWED_TABLES:
            if f" from {table}" in query_lower or f" join {table}" in query_lower:
                table_found = True
        if not table_found:
            return False

    return True
