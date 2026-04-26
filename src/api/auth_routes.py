"""Registration, login, profile, and admin user management."""

from __future__ import annotations

import os
import re
import sqlite3
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from src.api import auth_tokens
from src.api.user_store import (
    UserRecord,
    create_user,
    get_user_by_id,
    get_user_with_hash_by_email,
    list_users,
    set_user_clearance,
    set_user_status,
    user_to_public_dict,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)


def auth_optional() -> bool:
    v = (os.getenv("INSIGHTPILOT_AUTH_OPTIONAL") or "1").strip().lower()
    return v in ("1", "true", "yes", "on")


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def get_token_credentials(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> str | None:
    if creds is None or creds.scheme.lower() != "bearer":
        return None
    t = (creds.credentials or "").strip()
    return t or None


def get_current_user(token: Annotated[str | None, Depends(get_token_credentials)]) -> UserRecord:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = auth_tokens.decode_user_id(token)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(uid)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: Annotated[UserRecord, Depends(get_current_user)]) -> UserRecord:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


@router.get("/config")
def auth_config():
    return {
        "auth_optional": auth_optional(),
        "ask_requires_auth": not auth_optional(),
    }


class RegisterBody(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)


class LoginBody(BaseModel):
    email: str
    password: str


class PatchUserBody(BaseModel):
    data_clearance: str


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@router.post("/register")
def register(body: RegisterBody):
    email = _normalize_email(body.email)
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email")
    if get_user_with_hash_by_email(email):
        raise HTTPException(status_code=409, detail="Email already registered")
    try:
        user = create_user(email, body.password)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered") from None
    return {
        "message": "Registration received. An administrator must activate your account before you can run queries.",
        "user": user_to_public_dict(user),
    }


@router.post("/login")
def login(body: LoginBody):
    email = _normalize_email(body.email)
    row = get_user_with_hash_by_email(email)
    if not row or not verify_password(body.password, row[1]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user = row[0]
    token = auth_tokens.create_access_token(user_id=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_to_public_dict(user),
    }


@router.get("/me")
def me(user: Annotated[UserRecord, Depends(get_current_user)]):
    return user_to_public_dict(user)


@router.get("/admin/users")
def admin_list_users(_admin: Annotated[UserRecord, Depends(require_admin)]):
    return [user_to_public_dict(u) for u in list_users()]


@router.post("/admin/users/{user_id}/approve")
def admin_approve_user(
    user_id: str,
    _admin: Annotated[UserRecord, Depends(require_admin)],
):
    u = set_user_status(user_id, "active")
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_public_dict(u)


@router.patch("/admin/users/{user_id}")
def admin_patch_user(
    user_id: str,
    body: PatchUserBody,
    _admin: Annotated[UserRecord, Depends(require_admin)],
):
    u = set_user_clearance(user_id, body.data_clearance)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_public_dict(u)
