/** API / demo snapshot shape for Analyze results */
export type QueryResult = {
  answer: string;
  question: string;
  row_count: number;
  sql: string | null;
  rows: Record<string, unknown>[];
  confidence_score?: number;
  confidence_reason?: string;
  needs_clarification?: boolean;
  clarification_question?: string | null;
  clarification_choices?: string[] | null;
  privacy?: {
    policy_version?: string;
    redacted_fields: string[];
  };
};
