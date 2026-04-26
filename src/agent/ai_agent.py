from src.agent.response_formatter import format_response
from dotenv import load_dotenv
import json
import logging
import os
import time

load_dotenv()

import re

_logger = logging.getLogger(__name__)
from openai import OpenAI

from src.agent.masking import apply_column_policy
from src.agent.sql_executor import execute_read_query
from src.agent.sql_validator import validate_query

# Seconds — use a float so we do not require a separate `httpx` install at import time
# (OpenAI SDK bundles httpx; explicit `import httpx` broke setups where only `openai` was installed).
_LLM_TIMEOUT_S = 90.0
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=_LLM_TIMEOUT_S,
)
MODEL_NAME = "gpt-4.1-mini"
MAX_RETRIES = 2
CONFIDENCE_THRESHOLD = int(os.getenv("ASK_CONFIDENCE_THRESHOLD", "70"))
# After user picks a quick-choice follow-up, do not loop clarification unless score is critically low.
# Must match substring used in frontend buildMergedIntent (follow-up round).
_FOLLOWUP_MARK = "Follow-up answers"
_FOLLOWUP_OVERRIDE_MIN_SCORE = int(os.getenv("ASK_FOLLOWUP_OVERRIDE_MIN_SCORE", "40"))


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
- (there is NO quantity column: each row is one line item; use SUM(price) for line-item sales total)

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
You are InsightPilot, an expert analytics SQL generator for this e-commerce database.

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
9. If the question is ambiguous and there is NO "Follow-up answers" section, make the safest reasonable assumption.
10. Do not invent columns or tables.
11. When the user asks in English and the result needs product category labels, join category_translation and use product_category_name_english for display (keep joins to products when needed).
12. If the message contains a section that includes "Follow-up answers", the numbered lines under it are binding: the SELECT must implement those constraints (metric, grain, time scope). If they conflict with earlier text, follow the follow-up answers.
13. There is NO items.quantity column. Line-item revenue is SUM(items.price) (each row is one line item). For payment totals use payments.payment_value. Only add freight if the user asks about shipping cost or total including freight.
14. "Orders" counts usually mean COUNT(DISTINCT orders.order_id) where appropriate.

{SCHEMA_CONTEXT}
"""

CRITIC_PROMPT = """
You evaluate whether a generated SQL query correctly answers a user question.
Return ONLY valid JSON with this shape:
{
  "confidence_score": integer from 0 to 100,
  "confidence_reason": string,
  "needs_clarification": boolean,
  "clarification_question": string or null,
  "suggested_choices": array of 2 to 4 strings or empty array
}

Rules for clarification:
- If needs_clarification is true, write clarification_question as ONE short sentence
  for a non-technical business user. Friendly, plain language.
- NEVER mention SQL, tables, columns, JOINs, SQLite, or schema names.
- Do NOT ask the user to pick metrics from a list without help: ALWAYS fill
  suggested_choices with 2–4 concrete options phrased as what the user would say
  in reply (full sentences or short phrases they can click). Each option should
  imply a different safe interpretation (e.g. order counts vs revenue vs reviews).
- If needs_clarification is false, use suggested_choices: [] and clarification_question: null.

CRITICAL — suggested_choices must be achievable with this dataset only:
- Line-item "sales" or "revenue" means totals of line item prices: there is NO
  quantity column on items; do not imply price×quantity or per-unit times quantity.
- Use plain language like "total sales from line items", "order volume", "payment amounts",
  "review scores" — each must be answerable with orders, items, payments, reviews, etc.
- Do not suggest metrics that would require missing columns (e.g. quantity per line item).

Set needs_clarification=true when the user intent is ambiguous or the SQL likely
does not answer the exact question safely.

If the user message already contains a block like "Follow-up answers:" with numbered
lines, the user has already clarified once — set needs_clarification=false unless
the SQL is clearly wrong or unsafe (use a low confidence_score in that case).
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


def generate_sql(question: str, fix_hint: str | None = None) -> str:
    """
    Ask OpenAI to generate SQL for the user's question.
    If fix_hint is set, the previous query failed in SQLite — correct using schema only.
    """
    user_content = question
    if fix_hint:
        user_content = (
            f"{question}\n\n"
            "The previous SELECT failed in SQLite. Return ONE corrected SELECT only. "
            "Use only columns that exist in the schema: items has NO quantity column; "
            "line-item sales total use SUM(items.price). Error:\n"
            f"{fix_hint}"
        )
    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )

    raw_sql = response.choices[0].message.content or ""
    sql = clean_sql(raw_sql)
    return sql


def _parse_critic_json(raw_text: str) -> dict:
    text = (raw_text or "").strip()
    if not text:
        raise ValueError("empty critic response")

    # Handle accidental fenced output.
    text = re.sub(r"^```(?:json)?", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"```$", "", text).strip()
    return json.loads(text)


def evaluate_sql_confidence(question: str, sql: str) -> dict:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=0,
        messages=[
            {"role": "system", "content": CRITIC_PROMPT},
            {
                "role": "user",
                "content": f"Question:\n{question}\n\nGenerated SQL:\n{sql}",
            },
        ],
    )
    raw = response.choices[0].message.content or ""

    try:
        parsed = _parse_critic_json(raw)
    except Exception:
        # Conservative fallback: allow execution, but mark low confidence reason.
        return {
            "confidence_score": 65,
            "confidence_reason": "Critic output could not be parsed; proceeding with caution.",
            "needs_clarification": False,
            "clarification_question": None,
            "suggested_choices": [],
        }

    score = parsed.get("confidence_score")
    try:
        score = int(score)
    except Exception:
        score = 60
    score = max(0, min(100, score))

    needs_clarification = bool(parsed.get("needs_clarification"))
    clarification_question = parsed.get("clarification_question")
    if clarification_question is not None:
        clarification_question = str(clarification_question).strip() or None

    # Enforce threshold gate even when critic forgets to set the flag.
    if score < CONFIDENCE_THRESHOLD:
        needs_clarification = True

    if needs_clarification and not clarification_question:
        clarification_question = (
            "Pick the focus below, or describe what you want in a sentence."
        )

    raw_choices = parsed.get("suggested_choices")
    suggested_choices: list[str] = []
    if isinstance(raw_choices, list):
        for x in raw_choices:
            if isinstance(x, str) and x.strip():
                suggested_choices.append(x.strip())
    suggested_choices = suggested_choices[:4]

    if needs_clarification and len(suggested_choices) < 2:
        suggested_choices = [
            "Compare by number of orders in each period.",
            "Compare by total sales (sum of line item prices).",
            "Compare average customer review scores.",
        ]

    return {
        "confidence_score": score,
        "confidence_reason": str(parsed.get("confidence_reason") or "Confidence estimated by critic."),
        "needs_clarification": needs_clarification,
        "clarification_question": clarification_question,
        "suggested_choices": suggested_choices if needs_clarification else [],
    }


def _has_followup_answers_block(question: str) -> bool:
    return _FOLLOWUP_MARK in (question or "")


def ask_agent(question: str, *, max_sensitivity: str | None = None) -> dict:
    """
    Generate guarded SQL, validate it, execute it, and return results.

    ``max_sensitivity`` caps visible column sensitivities in result rows (see
    ``apply_column_policy``). ``None`` means no per-user cap beyond column policy masks.
    """
    if not (os.getenv("OPENAI_API_KEY") or "").strip():
        raise ValueError(
            "OPENAI_API_KEY is not set. Copy .env.example to .env in the repo root, "
            "add your key, and restart uvicorn."
        )

    last_error = None
    t_agent_start = time.perf_counter()
    sql_fix_hint: str | None = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            t_llm = time.perf_counter()
            sql = generate_sql(question, fix_hint=sql_fix_hint)
            sql_fix_hint = None
            llm_s = time.perf_counter() - t_llm

            if not validate_query(sql):
                raise ValueError(f"Generated SQL failed validation: {sql}")

            critic = evaluate_sql_confidence(question, sql)
            # Avoid clarification loops: after a quick-choice follow-up, the payload
            # includes "Follow-up answers:" — trust execution unless critic is very low.
            if (
                critic["needs_clarification"]
                and _has_followup_answers_block(question)
                and int(critic.get("confidence_score") or 0) >= _FOLLOWUP_OVERRIDE_MIN_SCORE
            ):
                critic = {
                    **critic,
                    "needs_clarification": False,
                    "confidence_reason": (
                        "Proceeding with your selected option. "
                        + (critic.get("confidence_reason") or "")
                    ).strip(),
                }

            if critic["needs_clarification"]:
                return {
                    "question": question,
                    "sql": None,
                    "rows": [],
                    "row_count": 0,
                    "answer": "I need one clarification before running this query.",
                    "confidence_score": critic["confidence_score"],
                    "confidence_reason": critic["confidence_reason"],
                    "needs_clarification": True,
                    "clarification_question": critic["clarification_question"],
                    "clarification_choices": critic.get("suggested_choices") or [],
                }

            t_sql = time.perf_counter()
            rows = execute_read_query(sql)
            sql_s = time.perf_counter() - t_sql

            masked_rows, privacy_meta = apply_column_policy(
                rows, max_sensitivity=max_sensitivity
            )

            total_s = time.perf_counter() - t_agent_start
            # Visible in the uvicorn terminal without extra logging config
            print(
                f"[insightpilot-agent] ok: llm={llm_s:.2f}s sqlite={sql_s:.3f}s "
                f"total={total_s:.2f}s attempt={attempt + 1}",
                flush=True,
            )
            _logger.info(
                "insightpilot_audit event=ask_ok policy_version=%s row_count=%s "
                "question_len=%s redacted_field_count=%s llm_s=%.2f sqlite_s=%.3f total_s=%.2f",
                privacy_meta.get("policy_version"),
                len(masked_rows),
                len(question or ""),
                len(privacy_meta.get("redacted_fields") or []),
                llm_s,
                sql_s,
                total_s,
            )

            return {
                "question": question,
                "sql": sql,
                "rows": masked_rows,
                "row_count": len(masked_rows),
                "answer": format_response(masked_rows),
                "confidence_score": critic["confidence_score"],
                "confidence_reason": critic["confidence_reason"],
                "needs_clarification": False,
                "clarification_question": None,
                "clarification_choices": None,
                "privacy": {
                    "policy_version": privacy_meta.get("policy_version"),
                    "redacted_fields": privacy_meta.get("redacted_fields") or [],
                },
            }

        except Exception as exc:
            last_error = exc
            err_str = str(exc).lower()
            _logger.warning("ask attempt %s failed: %s", attempt + 1, exc)
            if attempt < MAX_RETRIES and any(
                s in err_str
                for s in (
                    "no such column",
                    "no such table",
                    "syntax error",
                    "misuse",
                )
            ):
                sql_fix_hint = str(exc)
                continue

    raise RuntimeError(f"Agent failed after retries: {last_error}")
