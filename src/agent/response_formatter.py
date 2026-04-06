def format_response(rows):
    if not rows:
        return "No data found."

    if len(rows) == 1 and len(rows[0]) == 1:
        return f"The answer is {rows[0][0]}."

    return f"Query returned {len(rows)} rows."
