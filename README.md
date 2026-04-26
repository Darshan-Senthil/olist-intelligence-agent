# InsightPilot

An AI-powered analytics assistant for e-commerce data with guarded SQL generation and structured results.

## What it does

Business users ask questions in natural language; the system generates validated read-only SQL, executes it, and returns grounded answers plus rows.

## Data governance (MVP)

- **Policy file:** [`src/agent/column_policy.yaml`](src/agent/column_policy.yaml) defines each allowed table/column, a plain-language description, **sensitivity** (`public` / `internal` / `restricted`), and **mask** behavior (`none`, `redact`, `hash`, `truncate_text`).
- **Enforcement:** After SQLite runs a query, [`src/agent/masking.py`](src/agent/masking.py) applies the policy to result rows before the answer text and API JSON are built. Charts and tables use these masked values.
- **Catalog API:** `GET /catalog` returns the same policy as JSON (proxied as `GET /api/catalog` in dev). The Analyze page includes a **Data catalog and privacy** panel that loads this endpoint.
- **Audit (lite):** Successful runs log structured fields (`policy_version`, `row_count`, `question_len`, redacted column count, timings) without logging the full question text or cell values.
- **Limitations:** The LLM still receives the user’s natural-language question; do not paste secrets into the question box. Masking keys match **SQLite result column names** (often no table prefix); ambiguous duplicate names across tables use the strictest policy (see comments in `masking.py`). Stronger guarantees later: DB views, row-level security, and DLP on prompts.

Optional env: `INSIGHTPILOT_MASK_SALT` — set in production so hashed identifiers are not predictable across deployments.

## Tech stack

- **AI:** OpenAI (see `src/agent/ai_agent.py`)
- **Backend:** Python, FastAPI (`src/api/main.py`)
- **Database:** SQLite (dev); PostgreSQL / AWS RDS planned for production
- **UI:** React, Vite, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/) (Base UI + Radix-style primitives), Geist font, Framer Motion (`frontend/`)
- **Archived:** Streamlit prototype in `Archive/streamlit_app.py`

## Project layout

```
olist-intelligence-agent/
├── Archive/           # Legacy UI snapshots (Streamlit + old React)
├── frontend/          # Product UI (npm run dev)
├── src/
│   ├── agent/         # SQL generation, validation, execution
│   ├── api/           # FastAPI app
│   ├── ingestion/     # Data loading
│   └── ui/            # Pointer to archived Streamlit (see src/ui/README.md)
├── data/
└── ...
```

## Run locally

**0. Python dependencies (from repo root, venv recommended)**

```bash
pip install -r requirements.txt
```

**1. API (default port 8010 — matches `frontend/vite.config.js` proxy)**

```bash
# from repo root, with venv activated
uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8010
```

Quick check:

```bash
curl http://127.0.0.1:8010/
curl http://127.0.0.1:8010/health
curl http://127.0.0.1:8010/catalog
```

You should see `{"message":"InsightPilot API is running"}` and JSON from `/catalog` describing tables and column sensitivity.

**If you see `Address already in use`:** something else is bound to that port (often an old `uvicorn`). Find and stop it:

```bash
lsof -iTCP:8010 -sTCP:LISTEN
# note the PID in the second column, then:
kill <PID>
```

Or free a specific port in one step (macOS / Linux):

```bash
kill $(lsof -ti :8010)
```

Then run `uvicorn` again. If you prefer another port, use the same number in **`frontend/vite.config.js`** (`API_PROXY_TARGET`) and in `uvicorn --port`.

**2. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints. **Routes:** `/` is the marketing home page; `/analyze` is the query tool (requires a signed-in **active** account); `/demo` runs without login. `POST /api/ask` is proxied to `http://127.0.0.1:8010/ask`.

**If the UI never returns answers**

1. Confirm **step 1** succeeded — if you see `Address already in use`, free the port (`kill $(lsof -ti :8010)`) or pick another port and set **`API_PROXY_TARGET` in `frontend/vite.config.js`** to match `uvicorn --port`.
2. Ensure **`.env` in the repo root** contains `OPENAI_API_KEY` (loaded automatically by the API).
3. Ensure **`olist.db`** exists at the project root (run your ingestion script if tables are missing).

**Environment**

- Backend: `OPENAI_API_KEY` (required for the agent).
- Frontend: proxy target in `frontend/vite.config.js`; optional `VITE_API_URL` / `VITE_UNICORN_EMBED_URL` (see `frontend/.env.example`).
- CORS: FastAPI allows listed origins plus `localhost` / `127.0.0.1` on any port for local dev; override with `CORS_ORIGINS` for production.

## Accounts and auth

- **Analyze** (`/analyze`) requires a signed-in **active** account in the UI. New registrations are **pending** until an admin approves them.
- **First admin:** set `INSIGHTPILOT_BOOTSTRAP_ADMIN_EMAIL` and `INSIGHTPILOT_BOOTSTRAP_ADMIN_PASSWORD` (8+ characters) in `.env`, restart the API, then sign in at `/login` with that email and password. The bootstrap step creates or upgrades that user to an active admin.
- **API tokens:** `INSIGHTPILOT_AUTH_OPTIONAL=0` (recommended) means `POST /ask` requires a `Authorization: Bearer` JWT. Set `=1` only if you need anonymous `/ask` for local experiments; the product UI still gates Analyze on login.

## Author

Darshan Senthil
