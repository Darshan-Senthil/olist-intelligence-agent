import { lazy, Suspense, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft,
  BarChart3,
  CircleHelp,
  Code2,
  Copy,
  Loader2,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CodeBlock } from "@/components/CodeBlock";
import { ResultTable } from "@/components/ResultTable";
import { analyzeChartable } from "@/lib/chartData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { QueryResult } from "@/types/queryResult";

const ResultViz = lazy(() =>
  import("./ResultViz").then((m) => ({ default: m.ResultViz })),
);

const ease = [0.22, 1, 0.36, 1] as const;

export type ResultTab = "summary" | "chart" | "data" | "sql";

const RESULT_TABS: {
  id: ResultTab;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "summary", label: "Summary", Icon: AlignLeft },
  { id: "chart", label: "Chart", Icon: BarChart3 },
  { id: "data", label: "Table", Icon: Table2 },
  { id: "sql", label: "SQL", Icon: Code2 },
];

const block = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.04 + i * 0.06,
      duration: 0.5,
      ease,
    },
  }),
};

function confidenceTone(score?: number): "high" | "medium" | "low" {
  if (typeof score !== "number") return "medium";
  if (score >= 85) return "high";
  if (score >= 70) return "medium";
  return "low";
}

export type AnalyzeResultsPanelProps = {
  result: QueryResult | null;
  error: string | null;
  loading: boolean;
  resultTab: ResultTab;
  onResultTabChange: (tab: ResultTab) => void;
  clarificationDraft: string;
  onClarificationDraftChange: (value: string) => void;
  onClarifiedAsk: (reply: string) => void | Promise<void>;
  /** Step 2: jump back to edit question */
  onGoToAsk: () => void;
  /**
   * When set, user ran a suggested question in demo mode with no snapshot -
   * show CTA instead of generic “no results”.
   */
  snapshotMissQuestion?: string | null;
  /** True when the miss is a typed question, not one of the suggested chips (demo UX). */
  demoSnapshotMissIsCustom?: boolean;
  /** Dev + VITE_DEMO_EXPORT: show copy control on final evidence card */
  showDemoExport?: boolean;
  /** Clipboard key for demo export (e.g. intent root before merge) */
  demoExportKeyQuestion?: string;
};

export function AnalyzeResultsPanel({
  result,
  error,
  loading,
  resultTab,
  onResultTabChange,
  clarificationDraft,
  onClarificationDraftChange,
  onClarifiedAsk,
  onGoToAsk,
  snapshotMissQuestion,
  demoSnapshotMissIsCustom,
  showDemoExport,
  demoExportKeyQuestion,
}: AnalyzeResultsPanelProps) {
  const chartAnalysis = useMemo(
    () =>
      result?.rows?.length && !result?.needs_clarification
        ? analyzeChartable(result.rows)
        : null,
    [result],
  );

  const canCopyDemo =
    Boolean(showDemoExport) &&
    import.meta.env.DEV &&
    import.meta.env.VITE_DEMO_EXPORT === "1" &&
    Boolean(result?.sql) &&
    !result?.needs_clarification;

  async function copyDemoSnapshot() {
    if (!result || !canCopyDemo) return;
    const key = (demoExportKeyQuestion ?? result.question).trim();
    const snippet = JSON.stringify({ [key]: result }, null, 2);
    const text = `// Merge into DEMO_SNAPSHOTS in frontend/src/data/demoSnapshots.ts\n// Key must match SUGGESTED_QUESTIONS exactly.\n${snippet}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-12 space-y-8 md:mt-14 md:space-y-9">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Step 3
          </p>
          <p className="text-lg font-medium text-foreground">Results</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onGoToAsk}>
          Edit question
        </Button>
      </div>

      {!result && !error && !snapshotMissQuestion && (
        <Card className="gap-0 border-dashed border-border/60 bg-muted/10 py-0">
          <CardHeader className="space-y-3 px-6 pb-3 pt-6">
            <CardTitle className="text-lg font-medium text-foreground">
              No results yet
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Go to <span className="font-medium text-foreground">Ask</span>,
              run a query, and we will bring you back here with the answer,
              chart, table, and SQL in separate tabs.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onGoToAsk}
            >
              Go to your question
            </Button>
          </CardContent>
        </Card>
      )}

      {snapshotMissQuestion && !result && !error && (
        <Card className="border-border bg-card/90 shadow-sm ring-1 ring-border/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">
              {demoSnapshotMissIsCustom
                ? "Demo only answers suggested questions"
                : "Demo snapshot not recorded yet"}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {demoSnapshotMissIsCustom ? (
                <>
                  This workspace is offline: answers are loaded from a fixed list
                  of saved responses that match the{" "}
                  <strong>suggested prompts</strong> only. Type your own question
                  in{" "}
                  <Link to="/analyze" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Analyze
                  </Link>{" "}
                  while signed in, or pick a suggestion above for an instant demo
                  answer.
                </>
              ) : (
                <>
                  This suggested question does not have a saved demo response. Run
                  it on the live Analyze workspace, then add the JSON to{" "}
                  <code className="rounded bg-muted px-1 text-sm">
                    demoSnapshots.ts
                  </code>{" "}
                  (see file header).
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/analyze">Open Analyze</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onGoToAsk}
            >
              {demoSnapshotMissIsCustom ? "Use a suggested question" : "Pick another question"}
            </Button>
          </CardContent>
        </Card>
      )}

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <Card className="border-destructive/35 bg-destructive/8">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">
                  Something went wrong
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-destructive/95">
                  {error}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !error && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 md:space-y-9"
          >
            {result.needs_clarification ? (
              <>
                <motion.div
                  custom={0}
                  variants={block}
                  initial="hidden"
                  animate="show"
                >
                  <Card className="border-border bg-card/90 shadow-sm ring-1 ring-border/50 backdrop-blur">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-lg font-medium text-foreground">
                          Answer
                        </CardTitle>
                        {typeof result.confidence_score === "number" && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "border",
                              confidenceTone(result.confidence_score) ===
                                "high" &&
                                "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                              confidenceTone(result.confidence_score) ===
                                "medium" &&
                                "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                              confidenceTone(result.confidence_score) ===
                                "low" &&
                                "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                            )}
                          >
                            Confidence {result.confidence_score}%
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-lg leading-relaxed text-foreground md:text-xl">
                        {result.answer}
                      </p>
                      {result.confidence_reason && (
                        <p className="text-base leading-relaxed text-muted-foreground">
                          {result.confidence_reason}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  custom={1}
                  variants={block}
                  initial="hidden"
                  animate="show"
                >
                  <Card className="border-border bg-card/90 shadow-sm ring-1 ring-border/50 backdrop-blur">
                    <CardHeader className="space-y-2 pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
                        <CircleHelp
                          className="size-5 text-muted-foreground"
                          aria-hidden
                        />
                        Quick choice
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed text-muted-foreground">
                        Pick an option below (we suggest answers so you do not
                        need to know table or column names). Chart and full
                        results appear after the next successful run.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <p className="text-base leading-relaxed text-foreground">
                        {result.clarification_question ||
                          "Choose how you want to narrow this question."}
                      </p>
                      <div className="flex flex-col gap-2">
                        {(result.clarification_choices?.length
                          ? result.clarification_choices
                          : []
                        ).map((choice) => (
                          <Button
                            key={choice}
                            type="button"
                            variant="secondary"
                            className="h-auto min-h-11 justify-start whitespace-normal rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-left text-base font-normal leading-snug text-foreground hover:bg-muted/60"
                            disabled={loading}
                            onClick={() => void onClarifiedAsk(choice)}
                          >
                            {choice}
                          </Button>
                        ))}
                      </div>
                      <div className="space-y-2 border-t border-border/60 pt-4">
                        <p className="text-base font-medium text-foreground">
                          Something else?
                        </p>
                        <Textarea
                          value={clarificationDraft}
                          onChange={(e) =>
                            onClarificationDraftChange(e.target.value)
                          }
                          placeholder="Describe what you want in plain language."
                          rows={3}
                          className="resize-y border-input bg-background text-base text-foreground placeholder:text-muted-foreground/75"
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          size="lg"
                          className="h-11 w-full sm:w-auto"
                          disabled={loading || !clarificationDraft.trim()}
                          onClick={() =>
                            void onClarifiedAsk(clarificationDraft)
                          }
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Running…
                            </>
                          ) : (
                            "Continue with this answer"
                          )}
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                        Use <span className="font-medium">Edit question</span>{" "}
                        above to change your original wording; follow-up answers
                        are sent separately so the question does not keep
                        growing.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            ) : (
              <motion.div
                custom={0}
                variants={block}
                initial="hidden"
                animate="show"
              >
                <Card className="border-border bg-card/90 shadow-sm ring-1 ring-border/50 backdrop-blur">
                  <CardHeader className="space-y-2 pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-medium text-foreground">
                          Evidence
                        </CardTitle>
                        <CardDescription className="text-base leading-relaxed text-muted-foreground">
                          Summary is the default. Open Chart, Table, or SQL when
                          you need to verify or export.
                        </CardDescription>
                      </div>
                      {canCopyDemo && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1.5"
                          onClick={() => void copyDemoSnapshot()}
                        >
                          <Copy className="size-3.5" aria-hidden />
                          Copy demo snapshot JSON
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <div
                    className="flex flex-wrap gap-1 border-b border-border px-6"
                    role="tablist"
                    aria-label="Result sections"
                  >
                    {RESULT_TABS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={resultTab === id}
                        onClick={() => onResultTabChange(id)}
                        className={cn(
                          "-mb-px inline-flex items-center gap-1.5 rounded-t-lg border border-transparent px-3 py-2.5 text-base font-medium transition-colors",
                          resultTab === id
                            ? "border-border border-b-transparent bg-background text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                      >
                        <Icon className="size-3.5 opacity-80" aria-hidden />
                        {label}
                      </button>
                    ))}
                  </div>
                  <CardContent className="space-y-4 pt-5" role="tabpanel">
                    {resultTab === "summary" && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-lg font-medium text-foreground">
                              Answer
                            </h3>
                            {typeof result.confidence_score === "number" && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "border",
                                  confidenceTone(result.confidence_score) ===
                                    "high" &&
                                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                                  confidenceTone(result.confidence_score) ===
                                    "medium" &&
                                    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                                  confidenceTone(result.confidence_score) ===
                                    "low" &&
                                    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
                                )}
                              >
                                Confidence {result.confidence_score}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-lg leading-relaxed text-foreground md:text-xl">
                            {result.answer}
                          </p>
                          {result.confidence_reason && (
                            <p className="text-base leading-relaxed text-muted-foreground">
                              {result.confidence_reason}
                            </p>
                          )}
                        </div>
                        <Separator className="bg-border/60" />
                        <div className="space-y-3">
                          <h3 className="text-base font-medium text-foreground">
                            Run details
                          </h3>
                          <p className="text-base text-muted-foreground">
                            <span className="font-semibold tabular-nums text-foreground">
                              {result.row_count}
                            </span>{" "}
                            rows
                          </p>
                          <p className="text-base leading-relaxed text-muted-foreground">
                            <span className="font-medium text-foreground/90">
                              Question sent:{" "}
                            </span>
                            {result.question}
                          </p>
                        </div>
                      </div>
                    )}

                    {resultTab === "chart" && (
                      <div className="space-y-3">
                        <p className="text-base leading-relaxed text-muted-foreground">
                          We pick a default view from your columns (line when
                          the category looks like dates). Switch chart type when
                          it makes sense for the data.
                        </p>
                        {chartAnalysis ? (
                          <Suspense
                            fallback={
                              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                                Loading chart
                              </div>
                            }
                          >
                            <ResultViz
                              key={result.sql ?? "no-sql"}
                              analysis={chartAnalysis}
                            />
                          </Suspense>
                        ) : result.row_count > 0 ? (
                          <Card className="border-dashed border-border/50 bg-muted/15">
                            <CardFooter className="py-6 text-center text-base text-muted-foreground">
                              This result does not map to a simple chart (need a
                              category column and a numeric column). Check the
                              Table tab or refine the question.
                            </CardFooter>
                          </Card>
                        ) : (
                          <p className="text-base text-muted-foreground">
                            No rows returned, so there is nothing to chart yet.
                          </p>
                        )}
                      </div>
                    )}

                    {resultTab === "data" && (
                      <div className="space-y-3">
                        <p className="text-base leading-relaxed text-muted-foreground">
                          Values after column policy masking (restricted fields
                          may show hashes or redaction instead of raw values).
                        </p>
                        {result.privacy &&
                          (result.privacy.redacted_fields?.length ?? 0) > 0 && (
                            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                              Some columns were masked per policy v
                              {result.privacy.policy_version ?? "?"}:{" "}
                              <span className="font-mono text-[12px] text-foreground/90">
                                {result.privacy.redacted_fields.join(", ")}
                              </span>
                            </p>
                          )}
                        <ResultTable rows={result.rows} />
                      </div>
                    )}

                    {resultTab === "sql" && (
                      <div className="space-y-3">
                        {result.sql ? (
                          <CodeBlock code={result.sql} />
                        ) : (
                          <p className="text-base text-muted-foreground">
                            No SQL was returned for this run.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
