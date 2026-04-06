from src.agent.response_formatter import format_response
from dotenv import load_dotenv
import os

load_dotenv()

import re
from openai import OpenAI

from src.agent.sql_executor import execute_read_query
from src.agent.sql_validator import validate_query


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_NAME = "gpt-4.1-mini"
MAX_RETRIES = 2


SCHEMA_CONTEXT = """
DATABASE TABLES AND IMPORTANT COLUMNS

orders
- order_id
- customer_id
- order_status
- order_purchase_timestamp
- order_approved_at
- order_delivered_carrier_date
- order_delivered_customer_date
- order_estimated_delivery_date

customers
- customer_id
- customer_unique_id
- customer_zip_code_prefix
- customer_city
- customer_state

items
- order_id
- order_item_id
- product_id
- seller_id
- shipping_limit_date
- price
- freight_value

payments
- order_id
- payment_sequential
- payment_type
- payment_installments
- payment_value

reviews
- review_id
- order_id
- review_score
- review_comment_title
- review_comment_message
- review_creation_date
- review_answer_timestamp

sellers
- seller_id
- seller_zip_code_prefix
- seller_city
- seller_state

products
- product_id
- product_category_name
- product_name_lenght
- product_description_lenght
- product_photos_qty
- product_weight_g
- product_length_cm
- product_height_cm
- product_width_cm

geolocation
- geolocation_zip_code_prefix
- geolocation_lat
- geolocation_lng
- geolocation_city
- geolocation_state

category_translation
- product_category_name
- product_category_name_english

COMMON RELATIONSHIPS
- orders.customer_id = customers.customer_id
- items.order_id = orders.order_id
- items.product_id = products.product_id
- items.seller_id = sellers.seller_id
- payments.order_id = orders.order_id
- reviews.order_id = orders.order_id
- products.product_category_name = category_translation.product_category_name
"""

SYSTEM_PROMPT = f"""
You are an expert analytics SQL generator for the Olist e-commerce database.

Your job:
- Convert a user question into ONE valid SQLite SELECT query.
- Return SQL only.
- Do not return markdown.
- Do not explain anything.
- Do not include code fences.
- Do not include comments.

STRICT RULES
1. Only generate ONE SELECT statement.
2. Never use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, REPLACE.
3. Use only these tables:
   orders, customers, items, payments, reviews, sellers, products, geolocation, category_translation
4. Prefer explicit column names instead of SELECT *.
5. If returning rows, include LIMIT 100.
6. Use SQLite-compatible SQL only.
7. If aggregation is requested, do not add LIMIT unless row-level output is needed.
8. Use joins only when needed.
9. If the question is ambiguous, make the safest reasonable assumption.
10. Do not invent columns or tables.

{SCHEMA_CONTEXT}
"""


def clean_sql(raw_text: str) -> str:
    """
    Extract SQL from model output and normalize whitespace.
    """
    text = raw_text.strip()

    # Remove markdown fences if model adds them anyway
    text = re.sub(r"^```(?:sql)?", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"```$", "", text).strip()

    # Keep only first statement if model returns extra text after semicolon
    if ";" in text:
        first_part = text.split(";")[0].strip()
        text = first_part + ";"

    # Collapse repeated whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def generate_sql(question: str) -> str:
    """
    Ask OpenAI to generate SQL for the user's question.
    """
    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
    )

    raw_sql = response.choices[0].message.content or ""
    sql = clean_sql(raw_sql)
    return sql


def ask_agent(question: str) -> dict:
    """
    Generate guarded SQL, validate it, execute it, and return results.
    """
    last_error = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            sql = generate_sql(question)

            if not validate_query(sql):
                raise ValueError(f"Generated SQL failed validation: {sql}")

            rows = execute_read_query(sql)

            return {
                "question": question,
                "sql": sql,
                "rows": rows,
                "row_count": len(rows),
                "answer": format_response(rows),
            }

        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"Agent failed after retries: {last_error}")
