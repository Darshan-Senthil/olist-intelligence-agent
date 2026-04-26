const STORAGE_KEY = "olist-intelligence-history";
const MAX_ENTRIES = 25;
const MAX_ROWS_PER_ENTRY = 150;
const MAX_BYTES = 500_000;

export type HistoryEntry = {
  id: string;
  ts: number;
  question: string;
  answer: string;
  sql: string | null;
  row_count: number;
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
  truncated?: boolean;
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function trimRows(
  rows: Record<string, unknown>[],
): { rows: Record<string, unknown>[]; truncated: boolean } {
  if (rows.length <= MAX_ROWS_PER_ENTRY) {
    return { rows, truncated: false };
  }
  return {
    rows: rows.slice(0, MAX_ROWS_PER_ENTRY),
    truncated: true,
  };
}

function parseStored(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is HistoryEntry =>
        x != null &&
        typeof x === "object" &&
        "id" in x &&
        "question" in x &&
        "rows" in x,
    );
  } catch {
    return [];
  }
}

function fitSize(entries: HistoryEntry[]): HistoryEntry[] {
  let trimmed = [...entries];
  for (let attempt = 0; attempt < 8; attempt++) {
    const json = JSON.stringify(trimmed);
    if (json.length <= MAX_BYTES) return trimmed;
    const dropFromEnd = Math.min(3, Math.max(1, Math.floor(trimmed.length / 4)));
    trimmed = trimmed.slice(0, Math.max(1, trimmed.length - dropFromEnd));
    for (let i = 0; i < trimmed.length; i++) {
      const e = trimmed[i];
      if (e.rows.length > 20) {
        trimmed[i] = {
          ...e,
          rows: e.rows.slice(0, 20),
          truncated: true,
        };
      }
    }
  }
  return trimmed.slice(0, 1);
}

export function loadHistory(): HistoryEntry[] {
  if (typeof sessionStorage === "undefined") return [];
  return parseStored(sessionStorage.getItem(STORAGE_KEY));
}

export function saveHistory(entries: HistoryEntry[]): void {
  if (typeof sessionStorage === "undefined") return;
  let next = fitSize(entries);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    next = next.slice(0, Math.max(1, Math.floor(next.length / 2)));
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
}

export function appendToHistory(result: {
  question: string;
  answer: string;
  sql: string | null;
  row_count: number;
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
}): HistoryEntry[] {
  const { rows, truncated } = trimRows(result.rows);
  const entry: HistoryEntry = {
    id: newId(),
    ts: Date.now(),
    question: result.question,
    answer: result.answer,
    sql: result.sql,
    row_count: result.row_count,
    rows,
    confidence_score: result.confidence_score,
    confidence_reason: result.confidence_reason,
    needs_clarification: result.needs_clarification,
    clarification_question: result.clarification_question,
    clarification_choices: result.clarification_choices,
    privacy: result.privacy,
    truncated,
  };

  const prev = loadHistory();
  const merged = [entry, ...prev.filter((e) => e.sql !== entry.sql || e.question !== entry.question)].slice(
    0,
    MAX_ENTRIES,
  );
  saveHistory(merged);
  return merged;
}

export function clearHistory(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function toResultShape(entry: HistoryEntry): {
  question: string;
  answer: string;
  sql: string | null;
  row_count: number;
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
} {
  return {
    question: entry.question,
    answer: entry.answer,
    sql: entry.sql,
    row_count: entry.row_count,
    rows: entry.rows,
    confidence_score: entry.confidence_score,
    confidence_reason: entry.confidence_reason,
    needs_clarification: entry.needs_clarification,
    clarification_question: entry.clarification_question,
    clarification_choices: entry.clarification_choices,
    privacy: entry.privacy,
  };
}
