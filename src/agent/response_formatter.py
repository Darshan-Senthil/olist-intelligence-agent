def _first_value(row):
    if isinstance(row, dict):
        return next(iter(row.values()))
    return row[0]


def format_response(rows):
    if not rows:
        return "No data found."

    if len(rows) == 1 and len(rows[0]) == 1:
        return f"The answer is {_first_value(rows[0])}."

    return f"Query returned {len(rows)} rows."
