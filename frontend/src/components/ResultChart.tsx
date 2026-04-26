import { motion, useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPayload } from "@/lib/chartData";
import { cn } from "@/lib/utils";
import {
  CHART_AXIS_TICK,
  CHART_PALETTE,
  chartTooltipStyle,
  formatCompact,
} from "./chartTheme";

const BAR_FILL = CHART_PALETTE[0];

export function ResultChart({
  payload,
  className,
}: {
  payload: SeriesPayload;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { data } = payload;
  const many = data.length > 6;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn("w-full", className)}
    >
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/85">X axis: </span>
        {payload.labelColumn}
        <span className="mx-2 text-border">·</span>
        <span className="font-medium text-foreground/85">Y axis: </span>
        {payload.valueColumn}
      </p>
      <div className="h-[min(24rem,48vh)] w-full min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 28, right: 12, left: 4, bottom: many ? 52 : 16 }}
            barCategoryGap="14%"
          >
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="oklch(1 0 0 / 8%)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "oklch(1 0 0 / 10%)" }}
              interval={0}
              angle={many ? -35 : 0}
              textAnchor={many ? "end" : "middle"}
            />
            <YAxis
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={58}
              tickFormatter={(v) =>
                typeof v === "number" ? formatCompact(v) : String(v)
              }
            />
            <Tooltip
              cursor={{ fill: "oklch(1 0 0 / 5%)" }}
              contentStyle={chartTooltipStyle}
              formatter={(value: number | string) => [
                typeof value === "number"
                  ? value.toLocaleString()
                  : String(value),
                payload.valueColumn,
              ]}
            />
            <Bar
              dataKey="value"
              fill={BAR_FILL}
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
              animationDuration={reduce ? 0 : 880}
              animationEasing="ease-out"
            >
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v: number) => formatCompact(v)}
                className="fill-foreground/80 text-[10px]"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
