"""
Apply column_policy.yaml to query result rows.

MVP limitation: SQLite result keys are usually bare column names (no table prefix).
When the same name appears in multiple tables with different policies, we merge by
column name (case-insensitive) and apply the strictest sensitivity and its mask.
"""

from __future__ import annotations

import hashlib
import os
from functools import lru_cache
from typing import Any

from src.agent.policy_loader import (
    get_policy_version,
    load_column_policy,
    truncate_text_value,
)

_REDACT = "[redacted]"
_MASK_SALT = (os.getenv("INSIGHTPILOT_MASK_SALT") or "insightpilot-dev-salt").encode(
    "utf-8"
)
_SENS_ORDER = {"public": 0, "internal": 1, "restricted": 2}


def _best_entry(entries: list[dict[str, Any]]) -> dict[str, Any]:
    """Pick entry with highest sensitivity; tie-break keeps first max."""
    best = entries[0]
    for e in entries[1:]:
        if _SENS_ORDER[str(e["sensitivity"])] > _SENS_ORDER[str(best["sensitivity"])]:
            best = e
    return best


def _flatten_policy() -> dict[str, list[dict[str, Any]]]:
    """column_lower -> list of column entries (table-qualified metadata)."""
    policy = load_column_policy()
    by_lower: dict[str, list[dict[str, Any]]] = {}
    for table in policy.get("tables", []):
        tname = str(table.get("name", ""))
        for col in table.get("columns", []) or []:
            name = str(col.get("name", "")).strip()
            if not name:
                continue
            key = name.lower()
            entry = {
                "table": tname,
                "name": name,
                "sensitivity": str(col.get("sensitivity", "public")),
                "mask": str(col.get("mask", "none")),
            }
            by_lower.setdefault(key, []).append(entry)
    return by_lower


@lru_cache(maxsize=1)
def _cached_flatten() -> dict[str, list[dict[str, Any]]]:
    return _flatten_policy()


def _mask_value(mask: str, value: Any) -> Any:
    if mask == "none" or value is None:
        return value
    if mask == "redact":
        return _REDACT
    if mask == "hash":
        if value is None:
            return None
        digest = hashlib.sha256(_MASK_SALT + str(value).encode("utf-8")).hexdigest()[:12]
        return f"[id:{digest}]"
    if mask == "truncate_text":
        return truncate_text_value(value)
    return value


def apply_column_policy(
    rows: list[dict[str, Any]],
    *,
    max_sensitivity: str | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """
    Return (masked_rows, privacy_meta).
    privacy_meta includes policy_version and redacted_fields (column keys as returned).

    If ``max_sensitivity`` is ``public`` / ``internal`` / ``restricted``, columns with a
    *stricter* sensitivity than the caller may see are fully redacted.
    """
    if not rows:
        return [], {
            "policy_version": get_policy_version(),
            "redacted_fields": [],
        }

    user_cap: int | None = None
    if max_sensitivity is not None:
        ms = str(max_sensitivity).strip().lower()
        if ms not in _SENS_ORDER:
            raise ValueError(f"invalid max_sensitivity: {max_sensitivity!r}")
        user_cap = _SENS_ORDER[ms]

    flat = _cached_flatten()
    out_rows: list[dict[str, Any]] = []
    redacted_keys: set[str] = set()

    for row in rows:
        new_row: dict[str, Any] = {}
        for key, value in row.items():
            spec_list = flat.get(str(key).lower())
            if not spec_list:
                new_row[key] = value
                continue
            spec = _best_entry(spec_list)
            sens = str(spec["sensitivity"])
            if user_cap is not None and _SENS_ORDER[sens] > user_cap:
                redacted_keys.add(key)
                new_row[key] = _REDACT
                continue
            mask = spec["mask"]
            if mask != "none":
                redacted_keys.add(key)
            new_row[key] = _mask_value(mask, value)
        out_rows.append(new_row)

    return out_rows, {
        "policy_version": get_policy_version(),
        "redacted_fields": sorted(redacted_keys),
    }


__all__ = ["apply_column_policy"]
