"""JWT access tokens (HS256)."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

_ALG = "HS256"
_DEFAULT_DEV_SECRET = "insightpilot-dev-only-change-in-production"


def _secret() -> str:
    return (
        (os.getenv("INSIGHTPILOT_JWT_SECRET") or "").strip()
        or (os.getenv("SECRET_KEY") or "").strip()
        or _DEFAULT_DEV_SECRET
    )


def create_access_token(*, user_id: str, expires_hours: int | None = None) -> str:
    hours = expires_hours
    if hours is None:
        hours = int(os.getenv("INSIGHTPILOT_JWT_EXPIRE_HOURS", "168") or "168")
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=max(1, hours))
    payload: dict[str, Any] = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, _secret(), algorithm=_ALG)


def decode_user_id(token: str) -> str | None:
    try:
        data = jwt.decode(token, _secret(), algorithms=[_ALG])
        sub = data.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None
