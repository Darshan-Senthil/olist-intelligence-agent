import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# Load repo-root .env before importing the agent (explicit path; cwd-independent)
_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT / ".env")

from src.agent.ai_agent import ask_agent
from src.agent.policy_loader import catalog_for_api
from src.api import auth_tokens
from src.api.auth_routes import auth_optional, get_token_credentials, router as auth_router
from src.api.user_store import UserRecord, ensure_bootstrap_admin, get_user_by_id, init_db

_DEFAULT_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:4173,http://127.0.0.1:4173"
)
_origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", _DEFAULT_ORIGINS).split(",")
    if o.strip()
]

# Any localhost / 127.0.0.1 port (Vite often picks 5180+ when 5173 is busy)
_LOCAL_ORIGIN_REGEX = r"https?://(localhost|127\.0\.0\.1)(:\d+)?"

_ASK_RATE_LIMIT = os.getenv("ASK_RATE_LIMIT", "60/minute")

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    ensure_bootstrap_admin()
    yield


app = FastAPI(title="InsightPilot API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_LOCAL_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


def resolve_ask_actor(
    token: str | None = Depends(get_token_credentials),
) -> UserRecord | None:
    if token:
        uid = auth_tokens.decode_user_id(token)
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user = get_user_by_id(uid)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.status != "active":
            raise HTTPException(
                status_code=403,
                detail="Account is pending administrator approval.",
            )
        return user
    if auth_optional():
        return None
    raise HTTPException(
        status_code=401,
        detail="Sign in is required to run queries. Set INSIGHTPILOT_AUTH_OPTIONAL=1 for local open access.",
    )


class AskRequest(BaseModel):
    question: str


@app.get("/")
def root():
    return {"message": "InsightPilot API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/catalog")
@app.get("/api/catalog")
def catalog():
    """Read-only data catalog and column sensitivity (from column_policy.yaml).

    Exposed at both paths so clients work whether or not a proxy strips the ``/api``
    prefix (e.g. direct ``http://127.0.0.1:8010/api/catalog`` vs rewritten ``/catalog``).
    """
    return catalog_for_api()


@app.post("/ask")
@app.post("/api/ask")
@limiter.limit(_ASK_RATE_LIMIT)
def ask(
    request: Request,
    payload: AskRequest,
    actor: UserRecord | None = Depends(resolve_ask_actor),
):
    max_sens = actor.data_clearance if actor else None
    try:
        result = ask_agent(payload.question, max_sensitivity=max_sens)
        return result
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={
                "error": "invalid_request",
                "detail": str(exc),
            },
        )
    except RuntimeError as exc:
        return JSONResponse(
            status_code=502,
            content={
                "error": "agent_failed",
                "detail": str(exc),
            },
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_error",
                "detail": str(exc),
            },
        )
