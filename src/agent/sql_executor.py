from src.ingestion.db import get_connection
from src.agent.sql_validator import validate_query


def execute_read_query(query: str):
    if not validate_query(query):
        raise ValueError("Unsafe query blocked by validator")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(query)
    description = cursor.description
    colnames = [d[0] for d in description] if description else []
    raw_rows = cursor.fetchall()
    conn.close()

    if not colnames:
        return []
    return [dict(zip(colnames, row)) for row in raw_rows]
