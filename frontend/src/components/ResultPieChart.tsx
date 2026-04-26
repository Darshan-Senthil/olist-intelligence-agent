import { motion, useReducedMotion } from "framer-motion";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SeriesPayload } from "@/lib/chartData";
import { cn } from "@/lib/utils";
import { CHART_PALETTE, chartTooltipStyle, formatCompact } from "./chartTheme";

export function ResultPieChart({
  payload,
  className,
}: {
  payload: SeriesPayload;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { data } = payload;
  const total = data.reduce((s, d) => s + d.value, 0);

  const labelForSlice = ({
    x,
    y,
    percent,
  }: {
    x: number;
    y: number;
    percent: number;
  }) => {
    if (!Number.isFinite(percent) || percent < 0.06) return null;
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--foreground)"
        fontSize={11}
        fontWeight={600}
      >
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn("w-full", className)}
    >
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/85">Values: </span>
        {payload.valueColumn}
        <span className="mx-2 text-border">·</span>
        <span className="font-medium text-foreground/85">Categories: </span>
        {payload.labelColumn}
      </p>

      <div className="grid gap-4 md:grid-cols-[minmax(320px,1fr)_220px]">
        <div className="h-[min(24rem,48vh)] w-full min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="74%"
                paddingAngle={2}
                label={labelForSlice}
                labelLine={false}
                animationDuration={reduce ? 0 : 880}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                    stroke="oklch(1 0 0 / 40%)"
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload: items }) => {
                  if (!active || !items?.length) return null;
                  const p = items[0];
                  const v = Number(p.value);
                  const name = String(p.name ?? "");
                  const pct =
                    total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                  return (
                    <div
                      className="rounded-[10px] border border-border px-3 py-2 text-xs text-popover-foreground shadow-sm"
                      style={chartTooltipStyle}
                    >
                      <div className="font-medium text-popover-foreground">
                        {name}
                      </div>
                      <div className="tabular-nums text-popover-foreground/85">
                        {v.toLocaleString()} ({pct}%)
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 rounded-xl border border-border/80 bg-muted/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Legend
          </p>
          <ul className="space-y-1.5">
            {data.map((d, i) => {
              const pct = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <li key={`${d.name}-${i}`} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }}
                  />
                  <span className="truncate text-foreground/90" title={d.name}>
                    {d.name}
                  </span>
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {formatCompact(d.value)} ({pct.toFixed(1)}%)
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
