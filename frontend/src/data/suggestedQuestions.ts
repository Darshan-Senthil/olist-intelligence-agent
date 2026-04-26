/** Plain-language starters; no SQL or table names required */
export const SUGGESTED_QUESTIONS = [
  "What are the top 10 product categories by total revenue from line items?",
  "How many orders were placed per month? Show order count and the month.",
  "Which customer states have the highest average order value?",
  "What is the breakdown of order status (delivered, canceled, and so on) by count?",
  "What share of payment value comes from each payment type?",
  "Which sellers had the highest total revenue from items sold?",
  "What is the average review score by product category? Use English category names.",
  "How many distinct customers placed more than one order?",
  "What are the most common payment installment counts for credit card payments?",
  "Which cities have the most customers?",
  "What is total freight value versus total item price summed by seller state?",
  "Show monthly order counts and total payment value by month.",
  "Which product categories have the lowest average review score? Limit to categories with at least 50 reviews.",
  "What percentage of orders have at least one review?",
  "What is the average delivery delay in days between purchase date and delivered-to-customer date, by customer state?",
] as const;

export type SuggestedQuestion = (typeof SUGGESTED_QUESTIONS)[number];
