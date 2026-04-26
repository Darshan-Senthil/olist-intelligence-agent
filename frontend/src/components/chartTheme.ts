export const chartTooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

export const CHART_AXIS_TICK = { fill: "oklch(0.52 0.02 80)", fontSize: 11 };

export const CHART_PALETTE = [
  "oklch(0.56 0.11 260)",
  "oklch(0.6 0.12 210)",
  "oklch(0.64 0.11 175)",
  "oklch(0.66 0.1 140)",
  "oklch(0.68 0.1 95)",
  "oklch(0.67 0.11 55)",
  "oklch(0.63 0.12 25)",
  "oklch(0.6 0.1 320)",
];

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}
