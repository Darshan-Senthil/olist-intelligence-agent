import { useState } from "react";
import {
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
} from "lucide-react";
import type {
  ChartAnalysis,
  ChartKind,
  SeriesPayload,
} from "@/lib/chartData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResultChart } from "./ResultChart";
import { ResultLineChart } from "./ResultLineChart";
import { ResultPieChart } from "./ResultPieChart";

function resolvePayload(
  analysis: ChartAnalysis,
  kind: ChartKind,
): SeriesPayload | null {
  if (kind === "bar") return analysis.bar;
  if (kind === "line") return analysis.line;
  return analysis.pie;
}

function firstAvailableKind(analysis: ChartAnalysis): ChartKind {
  if (analysis.bar) return "bar";
  if (analysis.line) return "line";
  return "pie";
}

export function ResultViz({ analysis }: { analysis: ChartAnalysis }) {
  const [override, setOverride] = useState<ChartKind | null>(null);

  const preferred = override ?? analysis.defaultKind;
  let displayKind = preferred;
  let payload = resolvePayload(analysis, preferred);
  if (!payload) {
    displayKind = firstAvailableKind(analysis);
    payload = resolvePayload(analysis, displayKind);
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Chart type"
      >
        <ChartToggle
          active={displayKind === "bar"}
          disabled={!analysis.bar}
          title={!analysis.bar ? "Need a category and numeric column" : undefined}
          onClick={() => setOverride("bar")}
        >
          <BarChart3 className="size-4" aria-hidden />
          Bar
        </ChartToggle>
        <ChartToggle
          active={displayKind === "line"}
          disabled={!analysis.line}
          title={
            analysis.lineDisabledReason ??
            (!analysis.line ? "Unavailable" : undefined)
          }
          onClick={() => setOverride("line")}
        >
          <LineIcon className="size-4" aria-hidden />
          Line
        </ChartToggle>
        <ChartToggle
          active={displayKind === "pie"}
          disabled={!analysis.pie}
          title={analysis.pieDisabledReason ?? undefined}
          onClick={() => setOverride("pie")}
        >
          <PieIcon className="size-4" aria-hidden />
          Pie
        </ChartToggle>
      </div>

      {payload && displayKind === "bar" && <ResultChart payload={payload} />}
      {payload && displayKind === "line" && (
        <ResultLineChart payload={payload} />
      )}
      {payload && displayKind === "pie" && <ResultPieChart payload={payload} />}
    </div>
  );
}

function ChartToggle({
  children,
  active,
  disabled,
  title,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      disabled={disabled}
      title={title}
      className={cn("gap-1.5", disabled && "opacity-50")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
