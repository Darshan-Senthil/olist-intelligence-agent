import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Database, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { askQuestion } from "../lib/api";
import {
  AnalyzeResultsPanel,
  type ResultTab,
} from "../components/AnalyzeResultsPanel";
import { Background } from "../components/Background";
import { DataCatalogPanel } from "../components/DataCatalogPanel";
import { GovernanceBrief } from "../components/GovernanceBrief";
import { GlossaryPanel } from "../components/GlossaryPanel";
import { HistoryPanel } from "../components/HistoryPanel";
import { getDemoResult } from "../data/demoSnapshots";
import { SUGGESTED_QUESTIONS } from "../data/suggestedQuestions";
import { formatError } from "../lib/formatError";
import {
  appendToHistory,
  loadHistory,
  toResultShape,
  type HistoryEntry,
} from "../lib/sessionHistory";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { QueryResult } from "@/types/queryResult";

const ease = [0.22, 1, 0.36, 1] as const;

type AnalyzePhase = 1 | 2 | 3;
type OrientTab = "help" | "catalog" | "governance" | "controls";

const ORIENT_TABS: { id: OrientTab; label: string }[] = [
  { id: "help", label: "What you can ask" },
  { id: "catalog", label: "Data & privacy" },
  { id: "governance", label: "Governance & security" },
  { id: "controls", label: "How runs work" },
];

const ANALYZE_STEPS: {
  phase: AnalyzePhase;
  title: string;
  hint: string;
}[] = [
  { phase: 1, title: "Orient", hint: "Help, catalog, governance, controls" },
  { phase: 2, title: "Ask", hint: "Your question" },
  { phase: 3, title: "Results", hint: "Answer & evidence" },
];

/**
 * Merged payload for the API: follow-ups first so the model does not anchor on the
 * vague original question. Main textarea still shows only `root` (see runClarifiedAsk).
 */
function buildMergedIntent(root: string, followUpReplies: string[]): string {
  const r = root.trim();
  if (followUpReplies.length === 0) return r;
  return [
    "Follow-up answers (binding: the SQL must reflect these):",
    ...followUpReplies.map((line, i) => `${i + 1}. ${line.trim()}`),
    "",
    "Original question (context only if not in conflict above):",
    r,
  ].join("\n");
}

export default function ToolPage({ mode = "live" }: { mode?: "live" | "demo" }) {
  const isDemo = mode === "demo";
  const [question, setQuestion] = useState("");
  /** First question in this run; textarea stays on this instead of growing with merges. */
  const [intentRoot, setIntentRoot] = useState("");
  const [clarificationReplies, setClarificationReplies] = useState<string[]>([]);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [clarificationDraft, setClarificationDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshotMissQuestion, setSnapshotMissQuestion] = useState<string | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    isDemo ? [] : loadHistory(),
  );
  const reduceMotion = useReducedMotion();
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<AnalyzePhase>(1);
  const [orientTab, setOrientTab] = useState<OrientTab>("help");
  const [resultTab, setResultTab] = useState<ResultTab>("summary");

  useLayoutEffect(() => {
    if (
      phase !== 3 ||
      !(result || error || snapshotMissQuestion) ||
      !resultsRef.current
    )
      return;
    resultsRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [result, error, snapshotMissQuestion, phase, reduceMotion]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSnapshotMissQuestion(null);
    setPhase(2);
    setClarificationDraft("");
    setIntentRoot(q);
    setClarificationReplies([]);
    try {
      if (isDemo) {
        const data = getDemoResult(q);
        if (data) {
          setResult(data);
          setSnapshotMissQuestion(null);
        } else {
          setResult(null);
          setSnapshotMissQuestion(q);
        }
        setPhase(3);
        setResultTab("summary");
      } else {
        const data = await askQuestion(q);
        setResult(data);
        setPhase(3);
        setResultTab("summary");
        if (!data?.needs_clarification && data?.sql) {
          try {
            setHistory(appendToHistory(data));
          } catch {
            /* sessionStorage full or quota; result still shown */
          }
        }
      }
    } catch (err) {
      setError(formatError(err));
      setPhase(3);
    } finally {
      setLoading(false);
    }
  };

  const runClarifiedAsk = async (userReply: string) => {
    const reply = userReply.trim();
    if (!reply || !result?.needs_clarification) return;

    if (isDemo) {
      setError(
        "Follow-up clarification is only available in live Analyze (connected to the API).",
      );
      return;
    }

    const root = intentRoot.trim() || result.question.trim();
    const nextChain = [...clarificationReplies, reply];
    const merged = buildMergedIntent(root, nextChain);

    setLoading(true);
    setError(null);
    try {
      const data = await askQuestion(merged);
      setResult(data);
      setPhase(3);
      setResultTab("summary");
      setClarificationReplies(nextChain);
      setClarificationDraft("");
      setQuestion(root);
      if (!data?.needs_clarification && data?.sql) {
        try {
          setHistory(appendToHistory(data));
        } catch {
          /* sessionStorage full or quota; result still shown */
        }
      }
    } catch (err) {
      setError(formatError(err));
      setPhase(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="relative min-h-screen"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <Background />

      <div className="relative z-10 mx-auto w-full max-w-[min(100rem,calc(100%-1.5rem))] px-5 pb-28 pt-10 sm:px-8 md:pt-12 lg:px-10 xl:px-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-8 xl:gap-x-14">
          <div className="min-w-0 lg:col-span-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-10 space-y-5 text-left md:mb-12"
        >
          <Badge
            variant="secondary"
            className="h-9 rounded-full border border-border bg-card/90 px-4 py-1 text-sm font-normal tracking-wide text-muted-foreground shadow-sm"
          >
            <Database className="mr-2 size-4 opacity-80" aria-hidden />
            {isDemo
              ? "Demo · saved snapshots only · no API or model calls"
              : "Governed analytics runtime · Read-only SQL"}
          </Badge>
          <div className="max-w-3xl space-y-4">
            <h1 className="font-display text-balance text-3xl font-medium leading-[1.12] tracking-tight text-foreground sm:text-4xl md:text-[2.65rem]">
              {isDemo
                ? "InsightPilot demo workspace"
                : "InsightPilot analytics workspace"}
            </h1>
            <p className="max-w-2xl text-pretty text-xl leading-relaxed text-muted-foreground sm:text-[1.35rem]">
              {isDemo
                ? "Same steps and result layout as live Analyze. Suggested questions with a saved snapshot show real-style answers; others invite you to try the full product."
                : "Ask business questions and get answer text, SQL evidence, chart defaults, and exportable tables. Built for teams that need fast insights with clear governance."}
            </p>
          </div>
        </motion.div>

        <nav
          className="sticky top-16 z-30 -mx-1 mb-10 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-sm ring-1 ring-border/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 md:-mx-2 md:p-3 lg:-mx-0"
          aria-label="Analyze steps"
        >
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ANALYZE_STEPS.map((s) => {
              const active = phase === s.phase;
              const past = phase > s.phase;
              return (
                <li key={s.phase}>
                  <button
                    type="button"
                    onClick={() => setPhase(s.phase)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active && "bg-muted/80 ring-1 ring-border",
                      !active && "hover:bg-muted/40",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums",
                        active &&
                          "border-primary bg-primary text-primary-foreground",
                        past &&
                          "border-border bg-muted/50 text-foreground",
                        !active &&
                          !past &&
                          "border-muted-foreground/25 text-muted-foreground",
                      )}
                      aria-hidden
                    >
                      {s.phase}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-medium text-foreground">
                        {s.title}
                      </span>
                      <span className="block text-sm leading-snug text-muted-foreground">
                        {s.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {phase === 1 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45, ease }}
            className="mt-2"
          >
            <Card className="border-border bg-card/90 shadow-sm ring-1 ring-border/60 backdrop-blur">
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Step 1: Get your bearings
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  Open one topic at a time so the page stays easy to scan. When you
                  are ready, continue to your question. You can return here anytime
                  from the steps above.
                </CardDescription>
              </CardHeader>
              <div
                className="flex flex-wrap gap-1 border-b border-border px-6"
                role="tablist"
                aria-label="Orientation"
              >
                {ORIENT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={orientTab === t.id}
                    onClick={() => setOrientTab(t.id)}
                    className={cn(
                      "-mb-px rounded-t-lg border border-transparent px-3 py-2.5 text-base font-medium transition-colors",
                      orientTab === t.id
                        ? "border-border border-b-transparent bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <CardContent className="space-y-4 pt-4" role="tabpanel">
                {orientTab === "help" && (
                  <GlossaryPanel
                    defaultOpen
                    className="border-0 bg-transparent shadow-none ring-0"
                  />
                )}
                {orientTab === "catalog" && (
                  <DataCatalogPanel
                    defaultOpen
                    className="border-0 bg-transparent shadow-none ring-0"
                  />
                )}
                {orientTab === "governance" && <GovernanceBrief />}
                {orientTab === "controls" && (
                  <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-base leading-relaxed text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <ShieldCheck
                        className="size-4 shrink-0 text-foreground/80 dark:text-foreground"
                        aria-hidden
                      />
                      SQL validation blocks destructive statements.
                    </p>
                    <p className="flex items-center gap-2">
                      <ShieldCheck
                        className="size-4 shrink-0 text-foreground/80 dark:text-foreground"
                        aria-hidden
                      />
                      The query runs only against the allowed schema.
                    </p>
                    <p className="flex items-center gap-2">
                      <ShieldCheck
                        className="size-4 shrink-0 text-foreground/80 dark:text-foreground"
                        aria-hidden
                      />
                      SQL and table output are always shown for review.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/10 py-4">
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Tip: you can jump between steps anytime. Results open
                  automatically after each successful run.
                </p>
                <Button type="button" size="lg" onClick={() => setPhase(2)}>
                  Continue to your question
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.5, ease }}
            className="mt-2"
          >
            <Card className="border-border bg-card/90 shadow-sm ring-1 ring-border/60 backdrop-blur">
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="text-lg font-medium tracking-tight text-foreground">
                  Step 2: Your question
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  {isDemo
                    ? "Demo uses saved snapshots only. Choose a suggestion below to load it here, then run-typing is disabled."
                    : "One business question at a time. Mention date ranges or limits when you care about runtime."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-1">
                <Textarea
                  value={question}
                  onChange={(e) => {
                    if (!isDemo) setQuestion(e.target.value);
                  }}
                  readOnly={isDemo}
                  placeholder={
                    isDemo
                      ? "Pick a suggested question below…"
                      : "Example: top 10 product categories by number of line items sold."
                  }
                  rows={5}
                  className={cn(
                    "min-h-[160px] border-input text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/75",
                    isDemo
                      ? "cursor-default resize-none bg-muted/30"
                      : "resize-y bg-background",
                  )}
                  aria-readonly={isDemo}
                />
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground/90">
                    Suggested questions
                  </p>
                  <div className="flex max-h-[min(14rem,32vh)] flex-wrap gap-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuestion(q)}
                        className={cn(
                          "max-w-full rounded-full border border-border bg-background/70 px-3 py-2 text-left text-sm leading-snug text-foreground/90 sm:text-base",
                          "transition-colors hover:border-border hover:bg-muted/40",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 min-w-[9.5rem] bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90"
                    disabled={loading || !question.trim()}
                    onClick={handleAsk}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Working…
                      </>
                    ) : (
                      "Run query"
                    )}
                  </Button>
                  {loading && (
                    <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                      {isDemo
                        ? "Loading the saved snapshot…"
                        : "Calling the model and SQLite. Expect on the order of 20 to 90 seconds. When it finishes, we take you to Results automatically."}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setPhase(1)}
                  >
                    ← Back to orientation
                  </Button>
                  {(result || error || snapshotMissQuestion) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setPhase(3)}
                    >
                      View results →
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === 3 && (
          <div ref={resultsRef}>
            <AnalyzeResultsPanel
              result={result}
              error={error}
              loading={loading}
              resultTab={resultTab}
              onResultTabChange={setResultTab}
              clarificationDraft={clarificationDraft}
              onClarificationDraftChange={setClarificationDraft}
              onClarifiedAsk={(reply) => {
                void runClarifiedAsk(reply);
              }}
              onGoToAsk={() => {
                setPhase(2);
                setSnapshotMissQuestion(null);
              }}
              snapshotMissQuestion={snapshotMissQuestion}
              demoSnapshotMissIsCustom={Boolean(
                isDemo &&
                  snapshotMissQuestion &&
                  !SUGGESTED_QUESTIONS.some(
                    (s) => s === snapshotMissQuestion.trim(),
                  ),
              )}
              showDemoExport={!isDemo}
              demoExportKeyQuestion={intentRoot.trim() || result?.question}
            />
          </div>
        )}
          </div>

          <aside className="min-w-0 space-y-6 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
            <Card className="gap-0 border-border bg-card/90 py-0 shadow-sm ring-1 ring-border/60 backdrop-blur">
              <CardHeader className="space-y-3 px-6 pb-3 pt-6">
                <CardTitle className="text-lg font-medium text-foreground">
                  Governance and security
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  SQL validation, allowed tables, optional column masking, and
                  what stays in your browser versus the server.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full text-base"
                >
                  <Link to="/governance">Full governance guide</Link>
                </Button>
              </CardContent>
            </Card>
            {!isDemo && (
              <HistoryPanel
                entries={history}
                onRestore={(entry) => {
                  setError(null);
                  setResult(toResultShape(entry));
                  setPhase(3);
                  setResultTab("summary");
                }}
                onClear={() => setHistory([])}
              />
            )}
          </aside>
        </div>
      </div>
    </motion.div>
  );
}
