import pandas as pd
from src.ingestion.db import get_connection
from pathlib import Path

# Path to raw data
DATA_PATH = Path("data/raw")

# SQLite database file
DB_PATH = "olist.db"


def load_data():
    files = {
        "orders": "olist_orders_dataset.csv",
        "customers": "olist_customers_dataset.csv",
        "items": "olist_order_items_dataset.csv",
        "payments": "olist_order_payments_dataset.csv",
        "reviews": "olist_order_reviews_dataset.csv",
        "sellers": "olist_sellers_dataset.csv",
        "products": "olist_products_dataset.csv",
        "geolocation": "olist_geolocation_dataset.csv",
        "category_translation": "product_category_name_translation.csv",
    }

    dataframes = {}

    for name, file in files.items():
        path = DATA_PATH / file

        if not path.exists():
            print(f"File not found: {path}")
            continue

        df = pd.read_csv(path)
        print(f"Loaded {name}: {len(df)} rows")
        dataframes[name] = df

    return dataframes


def save_to_sqlite(dataframes):
    conn = get_connection()

    for name, df in dataframes.items():
        df.to_sql(name, conn, if_exists="replace", index=False)
        print(f"Saved {name} to database")

    conn.close()


if __name__ == "__main__":
    dfs = load_data()
    save_to_sqlite(dfs)
