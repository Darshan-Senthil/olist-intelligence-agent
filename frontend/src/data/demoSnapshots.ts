/**
 * Demo snapshots keyed by the **exact** string from `suggestedQuestions.ts` (see
 * `suggestedQuestions.ts`). Demo mode loads these only; no API calls.
 *
 * To refresh from a real run: Analyze + `VITE_DEMO_EXPORT=1` → “Copy demo snapshot JSON”.
 */

import type { QueryResult } from "@/types/queryResult";
import {
  SUGGESTED_QUESTIONS,
  type SuggestedQuestion,
} from "@/data/suggestedQuestions";

export type { SuggestedQuestion };

const demoPrivacy: QueryResult["privacy"] = {
  policy_version: "demo",
  redacted_fields: [],
};

const noClarify = {
  needs_clarification: false as const,
  clarification_question: null as const,
  clarification_choices: null as const,
};

export const DEMO_SNAPSHOTS = {
  "What are the top 10 product categories by total revenue from line items?": {
    question:
      "What are the top 10 product categories by total revenue from line items?",
    answer: "Query returned 5 rows.",
    row_count: 5,
    sql: `SELECT
  ct.product_category_name_english AS category,
  ROUND(SUM(i.price), 2) AS revenue
FROM items i
JOIN products p ON p.product_id = i.product_id
JOIN category_translation ct
  ON ct.product_category_name = p.product_category_name
GROUP BY ct.product_category_name_english
ORDER BY revenue DESC
LIMIT 10;`,
    rows: [
      { category: "health_beauty", revenue: 125890.42 },
      { category: "watches_gifts", revenue: 118203.11 },
      { category: "bed_bath_table", revenue: 104552.88 },
      { category: "sports_leisure", revenue: 98234.05 },
      { category: "computers_accessories", revenue: 90112.33 },
    ],
    confidence_score: 88,
    confidence_reason:
      "Demo snapshot: illustrative aggregates only. Live answers use your database and policy.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "How many orders were placed per month? Show order count and the month.": {
    question: "How many orders were placed per month? Show order count and the month.",
    answer: "Query returned 6 rows.",
    row_count: 6,
    sql: `SELECT strftime('%Y-%m', order_purchase_timestamp) AS month,
       COUNT(*) AS order_count
FROM orders
GROUP BY 1
ORDER BY 1 DESC
LIMIT 6;`,
    rows: [
      { month: "2018-01", order_count: 2840 },
      { month: "2017-12", order_count: 2712 },
      { month: "2017-11", order_count: 2655 },
      { month: "2017-10", order_count: 2510 },
      { month: "2017-09", order_count: 2398 },
      { month: "2017-08", order_count: 2288 },
    ],
    confidence_score: 86,
    confidence_reason: "Demo snapshot for monthly order volume.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "Which customer states have the highest average order value?": {
    question: "Which customer states have the highest average order value?",
    answer: "Query returned 5 rows.",
    row_count: 5,
    sql: `SELECT c.customer_state,
  ROUND(AVG(p.payment_value), 2) AS avg_order_value
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN payments p ON p.order_id = o.order_id
GROUP BY c.customer_state
ORDER BY avg_order_value DESC
LIMIT 5;`,
    rows: [
      { customer_state: "SP", avg_order_value: 172.45 },
      { customer_state: "RJ", avg_order_value: 168.2 },
      { customer_state: "MG", avg_order_value: 159.88 },
      { customer_state: "PR", avg_order_value: 151.33 },
      { customer_state: "RS", avg_order_value: 148.9 },
    ],
    confidence_score: 84,
    confidence_reason: "Demo snapshot: state-level averages.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "What is the breakdown of order status (delivered, canceled, and so on) by count?": {
    question:
      "What is the breakdown of order status (delivered, canceled, and so on) by count?",
    answer: "Query returned 4 rows.",
    row_count: 4,
    sql: `SELECT order_status, COUNT(*) AS orders
FROM orders
WHERE order_purchase_timestamp >= date('now', '-30 day')
GROUP BY order_status
ORDER BY orders DESC;`,
    rows: [
      { order_status: "delivered", orders: 2840 },
      { order_status: "shipped", orders: 412 },
      { order_status: "canceled", orders: 156 },
      { order_status: "processing", orders: 89 },
    ],
    confidence_score: 82,
    confidence_reason:
      "Demo snapshot for UX review. Connect to InsightPilot for governed live SQL.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "What share of payment value comes from each payment type?": {
    question: "What share of payment value comes from each payment type?",
    answer: "Query returned 3 rows.",
    row_count: 3,
    sql: `SELECT payment_type,
  ROUND(SUM(payment_value), 2) AS total_payment
FROM payments
GROUP BY payment_type
ORDER BY total_payment DESC
LIMIT 10;`,
    rows: [
      { payment_type: "credit_card", total_payment: 412000.5 },
      { payment_type: "boleto", total_payment: 128400.25 },
      { payment_type: "voucher", total_payment: 45200.0 },
    ],
    confidence_score: 80,
    confidence_reason:
      "Static demo row; production runs apply column policy masking.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "Which sellers had the highest total revenue from items sold?": {
    question: "Which sellers had the highest total revenue from items sold?",
    answer: "Query returned 5 rows.",
    row_count: 5,
    sql: `SELECT i.seller_id,
  ROUND(SUM(i.price), 2) AS revenue
FROM items i
GROUP BY i.seller_id
ORDER BY revenue DESC
LIMIT 5;`,
    rows: [
      { seller_id: "4b1e9b3f3e3e3e3e3e3e3e3e3e3e3e3e", revenue: 289450.12 },
      { seller_id: "2a2c2d2e2f2f2f2f2f2f2f2f2f2f2f2f", revenue: 241200.0 },
      { seller_id: "1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b", revenue: 198332.55 },
      { seller_id: "9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c9c", revenue: 176890.0 },
      { seller_id: "7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d", revenue: 154200.33 },
    ],
    confidence_score: 85,
    confidence_reason: "Demo snapshot: seller totals from line items.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "What is the average review score by product category? Use English category names.": {
    question:
      "What is the average review score by product category? Use English category names.",
    answer: "Query returned 5 rows.",
    row_count: 5,
    sql: `SELECT ct.product_category_name_english AS category,
  ROUND(AVG(r.review_score), 2) AS avg_score
FROM reviews r
JOIN items i ON i.order_id = r.order_id
JOIN products p ON p.product_id = i.product_id
JOIN category_translation ct
  ON ct.product_category_name = p.product_category_name
GROUP BY ct.product_category_name_english
ORDER BY avg_score DESC
LIMIT 5;`,
    rows: [
      { category: "watches_gifts", avg_score: 4.62 },
      { category: "health_beauty", avg_score: 4.51 },
      { category: "bed_bath_table", avg_score: 4.44 },
      { category: "sports_leisure", avg_score: 4.38 },
      { category: "computers_accessories", avg_score: 4.22 },
    ],
    confidence_score: 83,
    confidence_reason: "Demo snapshot: review averages by category.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "How many distinct customers placed more than one order?": {
    question: "How many distinct customers placed more than one order?",
    answer: "Query returned 1 row.",
    row_count: 1,
    sql: `SELECT COUNT(*) AS repeat_customers
FROM (
  SELECT customer_id
  FROM orders
  GROUP BY customer_id
  HAVING COUNT(*) > 1
) t;`,
    rows: [{ repeat_customers: 2481 }],
    confidence_score: 87,
    confidence_reason: "Demo snapshot: single aggregate.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "What are the most common payment installment counts for credit card payments?": {
    question:
      "What are the most common payment installment counts for credit card payments?",
    answer: "Query returned 4 rows.",
    row_count: 4,
    sql: `SELECT payment_installments AS installments,
  COUNT(*) AS cnt
FROM payments
WHERE payment_type = 'credit_card'
GROUP BY payment_installments
ORDER BY cnt DESC
LIMIT 4;`,
    rows: [
      { installments: 1, cnt: 42100 },
      { installments: 2, cnt: 18200 },
      { installments: 3, cnt: 6400 },
      { installments: 4, cnt: 1200 },
    ],
    confidence_score: 81,
    confidence_reason: "Demo snapshot: installment distribution.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "Which cities have the most customers?": {
    question: "Which cities have the most customers?",
    answer: "Query returned 5 rows.",
    row_count: 5,
    sql: `SELECT customer_city,
  COUNT(DISTINCT customer_id) AS customers
FROM customers
GROUP BY customer_city
ORDER BY customers DESC
LIMIT 5;`,
    rows: [
      { customer_city: "sao paulo", customers: 15440 },
      { customer_city: "rio de janeiro", customers: 6882 },
      { customer_city: "belo horizonte", customers: 3211 },
      { customer_city: "brasilia", customers: 2100 },
      { customer_city: "curitiba", customers: 1988 },
    ],
    confidence_score: 84,
    confidence_reason: "Demo snapshot: customer counts by city.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "What is total freight value versus total item price summed by seller state?": {
    question:
      "What is total freight value versus total item price summed by seller state?",
    answer: "Query returned 5 rows.",
    row_count: 5,
    sql: `SELECT s.seller_state,
  ROUND(SUM(i.freight_value), 2) AS total_freight,
  ROUND(SUM(i.price), 2) AS total_item_price
FROM items i
JOIN sellers s ON s.seller_id = i.seller_id
GROUP BY s.seller_state
ORDER BY total_item_price DESC
LIMIT 5;`,
    rows: [
      { seller_state: "SP", total_freight: 88420.5, total_item_price: 1820000.0 },
      { seller_state: "PR", total_freight: 42110.2, total_item_price: 910200.25 },
      { seller_state: "MG", total_freight: 38900.0, total_item_price: 876500.0 },
      { seller_state: "RJ", total_freight: 35200.75, total_item_price: 765400.5 },
      { seller_state: "SC", total_freight: 22100.0, total_item_price: 512300.0 },
    ],
    confidence_score: 82,
    confidence_reason: "Demo snapshot: freight vs item price by state.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "Show monthly order counts and total payment value by month.": {
    question: "Show monthly order counts and total payment value by month.",
    answer: "Query returned 5 rows.",
    row_count: 5,
    sql: `SELECT strftime('%Y-%m', o.order_purchase_timestamp) AS month,
  COUNT(DISTINCT o.order_id) AS orders,
  ROUND(SUM(p.payment_value), 2) AS payment_value
FROM orders o
JOIN payments p ON p.order_id = o.order_id
GROUP BY 1
ORDER BY 1 DESC
LIMIT 5;`,
    rows: [
      { month: "2018-01", orders: 2840, payment_value: 512300.45 },
      { month: "2017-12", orders: 2712, payment_value: 498200.0 },
      { month: "2017-11", orders: 2655, payment_value: 482100.33 },
      { month: "2017-10", orders: 2510, payment_value: 465400.12 },
      { month: "2017-09", orders: 2398, payment_value: 451000.88 },
    ],
    confidence_score: 85,
    confidence_reason: "Demo snapshot: orders and payments by month.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "Which product categories have the lowest average review score? Limit to categories with at least 50 reviews.":
    {
      question:
        "Which product categories have the lowest average review score? Limit to categories with at least 50 reviews.",
      answer: "Query returned 4 rows.",
      row_count: 4,
      sql: `SELECT ct.product_category_name_english AS category,
  ROUND(AVG(r.review_score), 2) AS avg_score,
  COUNT(*) AS review_count
FROM reviews r
JOIN items i ON i.order_id = r.order_id
JOIN products p ON p.product_id = i.product_id
JOIN category_translation ct
  ON ct.product_category_name = p.product_category_name
GROUP BY ct.product_category_name_english
HAVING review_count >= 50
ORDER BY avg_score ASC
LIMIT 4;`,
      rows: [
        { category: "office_furniture", avg_score: 3.82, review_count: 62 },
        { category: "home_appliances", avg_score: 3.91, review_count: 88 },
        { category: "telephony", avg_score: 3.95, review_count: 120 },
        { category: "toys", avg_score: 4.02, review_count: 74 },
      ],
      confidence_score: 79,
      confidence_reason: "Demo snapshot: low scores with minimum review volume.",
      ...noClarify,
      privacy: demoPrivacy,
    },

  "What percentage of orders have at least one review?": {
    question: "What percentage of orders have at least one review?",
    answer: "Query returned 1 row.",
    row_count: 1,
    sql: `SELECT ROUND(
  100.0 * (
    SELECT COUNT(DISTINCT order_id) FROM reviews
  ) / (SELECT COUNT(*) FROM orders),
  2
) AS pct_orders_with_review;`,
    rows: [{ pct_orders_with_review: 98.42 }],
    confidence_score: 86,
    confidence_reason: "Demo snapshot: illustrative percentage.",
    ...noClarify,
    privacy: demoPrivacy,
  },

  "What is the average delivery delay in days between purchase date and delivered-to-customer date, by customer state?":
    {
      question:
        "What is the average delivery delay in days between purchase date and delivered-to-customer date, by customer state?",
      answer: "Query returned 5 rows.",
      row_count: 5,
      sql: `SELECT c.customer_state,
  ROUND(AVG(
    julianday(o.order_delivered_customer_date) -
    julianday(o.order_purchase_timestamp)
  ), 1) AS avg_delay_days
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.order_delivered_customer_date IS NOT NULL
GROUP BY c.customer_state
ORDER BY avg_delay_days DESC
LIMIT 5;`,
      rows: [
        { customer_state: "AM", avg_delay_days: 18.4 },
        { customer_state: "AP", avg_delay_days: 16.2 },
        { customer_state: "RR", avg_delay_days: 15.1 },
        { customer_state: "PA", avg_delay_days: 12.8 },
        { customer_state: "MA", avg_delay_days: 11.9 },
      ],
      confidence_score: 78,
      confidence_reason: "Demo snapshot: delivery delay illustration.",
      ...noClarify,
      privacy: demoPrivacy,
    },
} satisfies Record<SuggestedQuestion, QueryResult>;

/** Resolve a saved demo snapshot; `question` must match a suggested chip exactly (trimmed). */
export function getDemoResult(question: string): QueryResult | null {
  const q = question.trim();
  if (!q) return null;
  const hit = DEMO_SNAPSHOTS[q as SuggestedQuestion];
  return hit ?? null;
}

/** Dev-only: assert all suggested questions have snapshots. Call from tests or devtools. */
export function assertDemoSnapshotsComplete(): void {
  for (const s of SUGGESTED_QUESTIONS) {
    if (!DEMO_SNAPSHOTS[s as SuggestedQuestion]) {
      throw new Error(`Missing demo snapshot for: ${JSON.stringify(s)}`);
    }
  }
}
