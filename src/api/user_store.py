"""
SQLite persistence for InsightPilot accounts (login, approval, data_clearance).
"""

from __future__ import annotations

import os
import sqlite3
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from passlib.context import CryptContext

_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_DB = _ROOT / "data" / "auth.db"

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

_VALID_STATUS = frozenset({"pending", "active"})
_VALID_CLEARANCE = frozenset({"public", "internal", "restricted"})


def get_db_path() -> Path:
    p = (os.getenv("INSIGHTPILOT_AUTH_DB") or str(_DEFAULT_DB)).strip()
    return Path(p).expanduser().resolve()


def _connect() -> sqlite3.Connection:
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT NOT NULL PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                status TEXT NOT NULL DEFAULT 'pending',
                data_clearance TEXT NOT NULL DEFAULT 'public',
                created_at REAL NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
            CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
            """
        )


@dataclass(frozen=True)
class UserRecord:
    id: str
    email: str
    role: str
    status: str
    data_clearance: str
    created_at: float


def hash_password(raw: str) -> str:
    return _pwd.hash(raw)


def verify_password(raw: str, password_hash: str) -> bool:
    try:
        return _pwd.verify(raw, password_hash)
    except ValueError:
        return False


def _row_to_user(r: sqlite3.Row) -> UserRecord:
    return UserRecord(
        id=str(r["id"]),
        email=str(r["email"]),
        role=str(r["role"]),
        status=str(r["status"]),
        data_clearance=str(r["data_clearance"]),
        created_at=float(r["created_at"]),
    )


def get_user_by_id(user_id: str) -> UserRecord | None:
    with _connect() as c:
        r = c.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return _row_to_user(r) if r else None


def get_user_with_hash_by_email(email: str) -> tuple[UserRecord, str] | None:
    n = (email or "").strip().lower()
    if not n or "@" not in n:
        return None
    with _connect() as c:
        r = c.execute(
            "SELECT * FROM users WHERE LOWER(email) = ?",
            (n,),
        ).fetchone()
    if not r:
        return None
    rec = _row_to_user(r)
    return rec, str(r["password_hash"])


def create_user(email: str, password: str) -> UserRecord:
    n = email.strip().lower()
    uid = str(uuid.uuid4())
    now = time.time()
    ph = hash_password(password)
    with _connect() as c:
        c.execute(
            "INSERT INTO users (id, email, password_hash, role, status, data_clearance, created_at) "
            "VALUES (?, ?, ?, 'user', 'pending', 'public', ?)",
            (uid, n, ph, now),
        )
    u = get_user_by_id(uid)
    if not u:
        raise RuntimeError("failed to read user after insert")
    return u


def list_users() -> list[UserRecord]:
    with _connect() as c:
        rows = c.execute(
            "SELECT id, email, role, status, data_clearance, created_at FROM users ORDER BY created_at ASC"
        ).fetchall()
    return [_row_to_user(r) for r in rows]


def set_user_status(user_id: str, status: str) -> UserRecord | None:
    if status not in _VALID_STATUS:
        raise ValueError("invalid status")
    with _connect() as c:
        c.execute("UPDATE users SET status = ? WHERE id = ?", (status, user_id))
    return get_user_by_id(user_id)


def set_user_clearance(user_id: str, clearance: str) -> UserRecord | None:
    cval = clearance.strip().lower()
    if cval not in _VALID_CLEARANCE:
        raise ValueError("invalid data_clearance")
    with _connect() as c:
        c.execute(
            "UPDATE users SET data_clearance = ? WHERE id = ?",
            (cval, user_id),
        )
    return get_user_by_id(user_id)


def user_to_public_dict(u: UserRecord) -> dict[str, Any]:
    return {
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "status": u.status,
        "data_clearance": u.data_clearance,
        "created_at": u.created_at,
    }


def ensure_bootstrap_admin() -> None:
    """If env vars are set, ensure that account exists as an active admin."""
    email = (os.getenv("INSIGHTPILOT_BOOTSTRAP_ADMIN_EMAIL") or "").strip().lower()
    password = os.getenv("INSIGHTPILOT_BOOTSTRAP_ADMIN_PASSWORD") or ""
    if not email or "@" not in email or len(password) < 8:
        return
    existing = get_user_with_hash_by_email(email)
    ph = hash_password(password)
    now = time.time()
    with _connect() as c:
        if existing:
            uid = existing[0].id
            c.execute(
                "UPDATE users SET password_hash = ?, role = 'admin', status = 'active', "
                "data_clearance = 'restricted' WHERE id = ?",
                (ph, uid),
            )
        else:
            uid = str(uuid.uuid4())
            c.execute(
                "INSERT INTO users (id, email, password_hash, role, status, data_clearance, created_at) "
                "VALUES (?, ?, ?, 'admin', 'active', 'restricted', ?)",
                (uid, email, ph, now),
            )


__all__ = [
    "UserRecord",
    "create_user",
    "ensure_bootstrap_admin",
    "get_db_path",
    "get_user_by_id",
    "get_user_with_hash_by_email",
    "hash_password",
    "init_db",
    "list_users",
    "set_user_clearance",
    "set_user_status",
    "user_to_public_dict",
    "verify_password",
]
