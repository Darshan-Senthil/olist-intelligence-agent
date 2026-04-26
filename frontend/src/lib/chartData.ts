/**
 * Heuristics to map tabular SQL rows to bar / line / pie chart payloads.
 */

export type ChartKind = "bar" | "line" | "pie";

export type SeriesPayload = {
  data: { name: string; value: number }[];
  labelColumn: string;
  valueColumn: string;
};

export type ChartAnalysis = {
  defaultKind: ChartKind;
  bar: SeriesPayload | null;
  line: SeriesPayload | null;
  pie: SeriesPayload | null;
  lineDisabledReason: string | null;
  pieDisabledReason: string | null;
};

const VALUE_HINT =
  /count|total|sum|value|amount|qty|quantity|revenue|sales|avg|mean|rows/i;
const DATE_NAME_HINT =
  /date|time|timestamp|month|year|day|week|period|_at$/i;

const MAX_BARS = 16;
const MAX_PIE_SLICES = 8;

function numericValue(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

function parseTimeMs(v: unknown): number | null {
  if (v == null) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.getTime();
  const s = String(v).trim();
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function shortLabel(raw: unknown, maxLen = 28): string {
  if (raw == null) return "(empty)";
  const s = String(raw);
  return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
}

function pickColumns(rows: Record<string, unknown>[]): {
  valueKey: string;
  labelKey: string;
} | null {
  if (!rows?.length) return null;
  const keys = Object.keys(rows[0]);
  if (keys.length < 2) return null;

  let valueKey = keys.find((k) => VALUE_HINT.test(k)) ?? "";
  if (!valueKey) {
    valueKey =
      keys.find((k) => rows.some((r) => numericValue(r[k]) !== null)) ?? "";
  }
  if (!valueKey) return null;

  const labelKey =
    keys.find((k) => k !== valueKey && rows.some((r) => r[k] != null)) ??
    keys[0];

  return { valueKey, labelKey };
}

function rowPoints(
  rows: Record<string, unknown>[],
  labelKey: string,
  valueKey: string,
): { name: string; value: number; sortKey: number | string }[] {
  const out: { name: string; value: number; sortKey: number | string }[] = [];
  for (const row of rows) {
    const n = numericValue(row[valueKey]);
    if (n === null) continue;
    const raw = row[labelKey];
    const t = parseTimeMs(raw);
    const sortKey: number | string = t != null ? t : String(raw ?? "");
    out.push({
      name: shortLabel(raw),
      value: n,
      sortKey,
    });
  }
  return out;
}

function isTimeSeriesColumn(
  labelKey: string,
  rows: Record<string, unknown>[],
): boolean {
  if (DATE_NAME_HINT.test(labelKey)) return true;
  if (!rows.length) return false;
  let ok = 0;
  let total = 0;
  for (const row of rows) {
    const v = row[labelKey];
    if (v == null || v === "") continue;
    total++;
    if (parseTimeMs(v) != null) ok++;
  }
  return total > 0 && ok / total >= 0.5;
}

function buildBarPayload(
  points: { name: string; value: number; sortKey: number | string }[],
  labelKey: string,
  valueKey: string,
): SeriesPayload | null {
  if (points.length < 1) return null;
  const sorted = [...points].sort((a, b) => b.value - a.value).slice(0, MAX_BARS);
  return {
    data: sorted.map(({ name, value }) => ({ name, value })),
    labelColumn: labelKey,
    valueColumn: valueKey,
  };
}

function buildLinePayload(
  points: { name: string; value: number; sortKey: number | string }[],
  labelKey: string,
  valueKey: string,
): SeriesPayload | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => {
    const ax = typeof a.sortKey === "number" ? a.sortKey : String(a.sortKey);
    const bx = typeof b.sortKey === "number" ? b.sortKey : String(b.sortKey);
    if (typeof ax === "number" && typeof bx === "number") return ax - bx;
    return String(ax).localeCompare(String(bx));
  });
  return {
    data: sorted.map(({ name, value }) => ({ name, value })),
    labelColumn: labelKey,
    valueColumn: valueKey,
  };
}

function buildPiePayload(
  points: { name: string; value: number }[],
  labelKey: string,
  valueKey: string,
): SeriesPayload | null {
  if (points.length < 1) return null;
  const sorted = [...points].sort((a, b) => b.value - a.value);
  if (sorted.length <= MAX_PIE_SLICES) {
    return {
      data: sorted.map(({ name, value }) => ({ name, value })),
      labelColumn: labelKey,
      valueColumn: valueKey,
    };
  }
  const head = sorted.slice(0, MAX_PIE_SLICES - 1);
  const tail = sorted.slice(MAX_PIE_SLICES - 1);
  const otherSum = tail.reduce((s, p) => s + p.value, 0);
  const data = [
    ...head.map(({ name, value }) => ({ name, value })),
    { name: "Other", value: otherSum },
  ];
  return { data, labelColumn: labelKey, valueColumn: valueKey };
}

/**
 * Analyze rows for visualization. Returns null if no numeric + label pairing works.
 */
export function analyzeChartable(rows: Record<string, unknown>[]): ChartAnalysis | null {
  const cols = pickColumns(rows);
  if (!cols) return null;

  const { valueKey, labelKey } = cols;
  const rawPoints = rowPoints(rows, labelKey, valueKey);
  if (rawPoints.length < 1) return null;

  const simplePoints = rawPoints.map((p) => ({
    name: p.name,
    value: p.value,
  }));

  const timeOk = isTimeSeriesColumn(labelKey, rows);
  const bar = buildBarPayload(rawPoints, labelKey, valueKey);
  const line =
    timeOk && rawPoints.length >= 2
      ? buildLinePayload(rawPoints, labelKey, valueKey)
      : null;
  const pie =
    simplePoints.length >= 1 ? buildPiePayload(simplePoints, labelKey, valueKey) : null;

  let defaultKind: ChartKind = "bar";
  if (timeOk && line) defaultKind = "line";

  const lineDisabledReason = !timeOk
    ? "Needs a date or time column for the category axis."
    : rawPoints.length < 2
      ? "Need at least two rows for a line chart."
      : null;

  return {
    defaultKind,
    bar,
    line,
    pie,
    lineDisabledReason,
    pieDisabledReason: pie ? null : "Not enough numeric categories for a pie chart.",
  };
}

/** @deprecated Use analyzeChartable().bar */
export function rowsToBarChartData(
  rows: Record<string, unknown>[],
  maxBars = MAX_BARS,
): SeriesPayload | null {
  const a = analyzeChartable(rows);
  if (!a?.bar) return null;
  if (maxBars >= MAX_BARS) return a.bar;
  return {
    ...a.bar,
    data: a.bar.data.slice(0, maxBars),
  };
}

export type BarChartPayload = SeriesPayload;
