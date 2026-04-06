# 🛒 Olist Intelligence Agent

> An AI-powered analytics assistant for e-commerce 
> data with enterprise-grade security and data governance

## What It Does
Business users can ask questions like:
- "What is our repeat purchase rate?"
- "Which sellers have best customer ratings?"
- "Show me order trends by state"

And get clear answers in plain English — no SQL needed.

## Tech Stack
- **AI:** OpenAI GPT
- **Backend:** Python, FastAPI
- **Database:** SQLite (dev) → AWS RDS PostgreSQL (prod)
- **UI:** Streamlit
- **Security:** JWT Auth, RBAC, PII Masking
- **Deployment:** AWS EC2
- **Data Governance:** Audit Logging, Data Catalog

## Architecture
Coming soon

## Project Structure

olist-intelligence-agent/
├── src/
│   ├── ingestion/     ← Data loading and cleaning
│   ├── security/      ← Auth, RBAC, PII masking
│   ├── agent/         ← AI agent logic
│   ├── governance/    ← Audit logs, data catalog
│   └── ui/            ← Streamlit interface
├── data/
│   ├── raw/           ← Original Olist CSVs
│   └── processed/     ← Cleaned data
├── tests/             ← Unit tests
├── docs/              ← Documentation
└── notebooks/      ← EDA notebooks


## Setup Instructions
Coming soon

## What I Learned
Coming soon — updated as project progresses

## Author
Darshan Senthil
