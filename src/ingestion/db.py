import sqlite3
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = PROJECT_ROOT / "olist.db"

def get_connection():
    return sqlite3.connect(DB_PATH)
