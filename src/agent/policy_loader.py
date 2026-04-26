"""
Load and validate column_policy.yaml (catalog + masking rules).
Tables must be a subset of sql_validator.ALLOWED_TABLES.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from src.agent.sql_validator import ALLOWED_TABLES

_POLICY_FILE = Path(__file__).resolve().with_name("column_policy.yaml")
_ALLOWED = frozenset(ALLOWED_TABLES)
_SENSITIVITY_ORDER = {"public": 0, "internal": 1, "restricted": 2}
_VALID_MASKS = frozenset({"none", "redact", "hash", "truncate_text"})
_TRUNCATE_LEN = 24


def _validate_policy(data: dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise ValueError("policy root must be a mapping")
    if "version" not in data or "tables" not in data:
        raise ValueError("policy must include version and tables")
    tables = data["tables"]
    if not isinstance(tables, list):
        raise ValueError("tables must be a list")

    seen_tables: set[str] = set()
    for t in tables:
        if not isinstance(t, dict):
            raise ValueError("each table must be a mapping")
        name = t.get("name")
        if not isinstance(name, str) or not name.strip():
            raise ValueError("table name must be a non-empty string")
        name = name.strip()
        if name not in _ALLOWED:
            raise ValueError(f"table {name!r} is not in ALLOWED_TABLES")
        if name in seen_tables:
            raise ValueError(f"duplicate table {name!r}")
        seen_tables.add(name)
        cols = t.get("columns")
        if not isinstance(cols, list) or not cols:
            raise ValueError(f"table {name} must have a non-empty columns list")
        seen_col: set[str] = set()
        for c in cols:
            if not isinstance(c, dict):
                raise ValueError(f"column in {name} must be a mapping")
            cn = c.get("name")
            if not isinstance(cn, str) or not cn.strip():
                raise ValueError(f"column name invalid in table {name}")
            cn = cn.strip()
            if cn in seen_col:
                raise ValueError(f"duplicate column {cn!r} in table {name}")
            seen_col.add(cn)
            sens = c.get("sensitivity", "public")
            if sens not in _SENSITIVITY_ORDER:
                raise ValueError(f"invalid sensitivity {sens!r} for {name}.{cn}")
            mask = c.get("mask", "none")
            if mask not in _VALID_MASKS:
                raise ValueError(f"invalid mask {mask!r} for {name}.{cn}")


@lru_cache(maxsize=1)
def load_column_policy() -> dict[str, Any]:
    raw = _POLICY_FILE.read_text(encoding="utf-8")
    data = yaml.safe_load(raw)
    if not isinstance(data, dict):
        raise ValueError("policy YAML must parse to a mapping")
    _validate_policy(data)
    return data


def get_policy_version() -> str:
    return str(load_column_policy().get("version", "unknown"))


def catalog_for_api() -> dict[str, Any]:
    """Payload for GET /catalog (read-only, no secrets)."""
    p = load_column_policy()
    return {
        "version": p.get("version"),
        "tables": p.get("tables", []),
    }


def truncate_text_value(value: Any, max_len: int = _TRUNCATE_LEN) -> str | None:
    if value is None:
        return None
    s = str(value)
    if len(s) <= max_len:
        return s
    return s[:max_len] + "…"
