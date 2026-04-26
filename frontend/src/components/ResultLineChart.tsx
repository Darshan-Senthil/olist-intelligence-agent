import { motion, useReducedMotion } from "framer-motion";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
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

const STROKE = CHART_PALETTE[1];

export function ResultLineChart({
  payload,
  className,
}: {
  payload: SeriesPayload;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const { data } = payload;
  const many = data.length > 8;
  const showPointLabels = data.length <= 12;

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
          <LineChart
            data={data}
            margin={{ top: showPointLabels ? 28 : 8, right: 12, left: 4, bottom: many ? 52 : 16 }}
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
              contentStyle={chartTooltipStyle}
              formatter={(value: number | string) => [
                typeof value === "number"
                  ? value.toLocaleString()
                  : String(value),
                payload.valueColumn,
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={STROKE}
              strokeWidth={2}
              dot={{ r: 3, fill: STROKE }}
              activeDot={{ r: 5 }}
              animationDuration={reduce ? 0 : 880}
            >
              {showPointLabels && (
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v: number) => formatCompact(v)}
                  className="fill-foreground/80 text-[10px]"
                />
              )}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
