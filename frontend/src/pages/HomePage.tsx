import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  Code2,
  Database,
  FileSearch,
  Gauge,
  LockKeyhole,
  MessageSquare,
  Network,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Table2,
  Workflow,
} from "lucide-react";
import { Background } from "@/components/Background";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NEXT_ANALYZE = encodeURIComponent("/analyze");

/** Wider product-marketing column; edge padding eats side space evenly on ultrawide. */
const shell =
  "mx-auto w-full max-w-[min(100rem,calc(100%-1.5rem))] px-4 sm:px-6 lg:px-10 xl:px-14";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Staggered hero line reveal */
const heroStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.075, delayChildren: 0.06 },
  },
};

const heroLine: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

const listRevealParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const listRevealItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
};

const bentoItem: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

function FadeIn({
  children,
  className,
  delay = 0,
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({
  children,
  lead,
  align = "left",
}: {
  children: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-[2.35rem] md:leading-[1.12]">
        {children}
      </h2>
      {lead ? (
        <p
          className={cn(
            "mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}

const workflow = [
  {
    title: "Ask in plain language",
    body: "You describe the metric or slice you care about-like revenue by category or orders per month-without writing SQL.",
  },
  {
    title: "Validate before it runs",
    body: "The system keeps queries read-only, on allowlisted tables, and aligned with your column policy before execution.",
  },
  {
    title: "Answer plus proof",
    body: "You get narrative context, tables and chart defaults, and the exact SQL so reviewers can trust what ran.",
  },
];

const whatYouGet = [
  {
    title: "Natural-language answers",
    body: "Summaries written for stakeholders, not just raw grids-grounded in the returned rows.",
    icon: MessageSquare,
    bento: "lg:col-span-2 lg:row-span-1" as const,
  },
  {
    title: "Tables you can export",
    body: "Inspect and download result sets; sensitive fields can be masked per policy.",
    icon: Table2,
    bento: "lg:col-span-1" as const,
  },
  {
    title: "Charts that match the data",
    body: "Sensible defaults for bar or line views when your result shape supports them.",
    icon: BarChart3,
    bento: "lg:col-span-1" as const,
  },
  {
    title: "SQL in the open",
    body: "Every successful run shows the executed query for audit, handoff, or analyst iteration.",
    icon: Code2,
    bento: "lg:col-span-2" as const,
  },
];

const personas = [
  {
    title: "Operations and CX",
    body: "Delivery delays, fulfillment risk, and cancellation patterns without writing SQL.",
    icon: Workflow,
  },
  {
    title: "Growth and marketing",
    body: "Category performance, payment mix, and geography in minutes.",
    icon: Gauge,
  },
  {
    title: "Finance and leadership",
    body: "KPI snapshots with row-level evidence when you need to trust the number.",
    icon: Building2,
  },
  {
    title: "Analysts",
    body: "First-pass NL queries with transparent SQL for iteration and sign-off.",
    icon: FileSearch,
  },
];

const trustBullets = [
  "Read-only execution; destructive statements blocked",
  "Allowlisted tables and validated SQL before run",
  "Column policy and masking on sensitive fields in results",
  "Session history stays in this browser (session storage)-not a full enterprise audit trail",
];

const architecture = [
  {
    title: "Agentic orchestration",
    body: "Natural language is turned into SQL through a workflow built for analytics.",
    icon: Bot,
  },
  {
    title: "Validation layer",
    body: "The validator enforces read-only behavior and allowed tables.",
    icon: SearchCheck,
  },
  {
    title: "Evidence back",
    body: "Answers ship with chart-ready rows and executed SQL for traceability.",
    icon: Database,
  },
  {
    title: "Room to grow",
    body: "Semantic models, RAG, and warehouse governance can plug in when you scale.",
    icon: Network,
  },
];

const faq = [
  {
    q: "What is InsightPilot, in one sentence?",
    a: "It is a governed analytics assistant: you ask business questions, it proposes read-only SQL against an allowlisted schema, runs it, and returns answers with tables, charts, and the query for review.",
  },
  {
    q: "What is the difference between the demo and signing in?",
    a: "The demo walks through the same Analyze steps using saved example responses-no model calls and no account. After sign-in, Live Analyze runs the agent and SQLite on the sample commerce dataset your administrator exposes.",
  },
  {
    q: "Do I need SQL?",
    a: "No to start. Suggested prompts help you ask useful questions; SQL appears for review when you want it.",
  },
  {
    q: "What data does this use?",
    a: "The product ships with a sample e-commerce style dataset (orders, items, payments, reviews, and related dimensions) so you can explore realistic questions without connecting your own warehouse yet.",
  },
  {
    q: "What happens to my session?",
    a: "Question history stays in this browser (session storage). It is not a substitute for enterprise audit logs.",
  },
  {
    q: "Can I trust the numbers?",
    a: "Every run is inspectable: answer text, tables, and generated SQL together so reviewers can verify.",
  },
];

function HeroProductVisual() {
  const reduce = useReducedMotion();
  const bars = [38, 62, 48, 78, 55, 70];
  return (
    <div className="relative">
      <motion.div
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/12 via-transparent to-amber-500/10 blur-2xl"
        aria-hidden
        animate={
          reduce
            ? undefined
            : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.02, 1] }
        }
        transition={
          reduce
            ? undefined
            : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/50 shadow-[0_2rem_4rem_-1.5rem_rgba(0,0,0,0.2)] ring-1 ring-foreground/5 will-change-transform dark:shadow-[0_2rem_4rem_-1.5rem_rgba(0,0,0,0.5)]"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.96, rotateX: 4 }}
        animate={
          reduce
            ? { opacity: 1 }
            : {
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
              }
        }
        transition={{ duration: 0.7, ease: easeOut, delay: 0.12 }}
        style={{ transformPerspective: 1200 }}
        {...(reduce
          ? {}
          : {
              whileHover: {
                y: -4,
                boxShadow: "0 2.5rem 4rem -1.25rem rgba(0,0,0,0.22)",
                transition: { type: "spring", stiffness: 400, damping: 28 },
              },
            })}
      >
        <div className="flex h-9 items-center gap-2 border-b border-border/70 bg-muted/30 px-3">
          <span className="size-2.5 rounded-full bg-red-500/70" />
          <span className="size-2.5 rounded-full bg-amber-500/60" />
          <span className="size-2.5 rounded-full bg-emerald-500/60" />
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            insightpilot / Analyze
          </span>
        </div>
        <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3 border-b border-border/60 p-4 md:border-b-0 md:border-r md:p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Question
            </p>
            <p className="text-sm font-medium leading-snug text-foreground sm:text-base">
              What are the top product categories by revenue this quarter?
            </p>
            <div className="space-y-2 pt-1">
              <motion.div
                className="h-1.5 w-full rounded bg-foreground/10"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, delay: 0.45, ease: easeOut }}
                style={{ transformOrigin: "left" }}
              />
              <motion.div
                className="h-1.5 w-[91%] rounded bg-foreground/6"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, delay: 0.55, ease: easeOut }}
                style={{ transformOrigin: "left" }}
              />
              <motion.div
                className="h-1.5 w-4/5 rounded bg-foreground/5"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.45, delay: 0.65, ease: easeOut }}
                style={{ transformOrigin: "left" }}
            />
            </div>
            <motion.div
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[10px] text-muted-foreground"
              initial={reduce ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75, duration: 0.4, ease: easeOut }}
            >
              <motion.span
                animate={
                  reduce
                    ? undefined
                    : { rotate: [0, -10, 10, -6, 0], scale: [1, 1.1, 1] }
                }
                transition={
                  reduce
                    ? undefined
                    : { delay: 1.1, duration: 0.6, ease: easeOut }
                }
              >
                <Sparkles className="size-3 text-primary" aria-hidden />
              </motion.span>
              Governed run · read-only
            </motion.div>
          </div>
          <div className="flex flex-col justify-between bg-muted/15 p-4 md:p-5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Result preview
              </p>
              <div className="mt-3 flex h-24 items-end gap-1.5 sm:h-28">
                {bars.map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 origin-bottom rounded-t-md bg-primary/50 dark:bg-primary/40"
                    initial={reduce ? false : { height: 0, opacity: 0.4 }}
                    animate={{ height: `${h}%`, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 26,
                      delay: 0.35 + i * 0.06,
                    }}
                  />
                ))}
              </div>
            </div>
            <motion.div
              className="mt-4 rounded-lg border border-border/50 bg-background/50 p-2.5 font-mono text-[9px] leading-relaxed text-muted-foreground sm:text-[10px]"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.35, ease: easeOut }}
            >
              <span className="text-emerald-600 dark:text-emerald-400">SELECT</span>{" "}
              category, <span className="text-amber-700/90 dark:text-amber-400/90">SUM</span>
              (price)…
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const isActive = user?.status === "active";
  const isPending = Boolean(user && user.status !== "active");

  return (
    <motion.div
      className="relative min-h-screen"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Background />

      <div className="relative z-10">
        {/* Hero: asymmetric grid, not a single narrow column */}
        <motion.section
          className={`${shell} pb-20 pt-10 sm:pb-24 sm:pt-14 md:pb-28 md:pt-16`}
          variants={container}
          initial="hidden"
          animate="show"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
            <motion.div variants={item} className="min-w-0 max-w-2xl lg:max-w-none">
              <motion.div
                variants={heroStagger}
                initial="hidden"
                animate="show"
                className="min-w-0"
              >
                <motion.p
                  variants={heroLine}
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm font-medium text-foreground/90 shadow-sm backdrop-blur sm:text-[0.9375rem]"
                >
                  <ShieldCheck
                    className="size-3.5 shrink-0 text-primary"
                    aria-hidden
                  />
                  Governed AI analytics for commerce
                </motion.p>
                <motion.h1
                  variants={heroLine}
                  className="font-display text-balance text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[3.4rem] xl:text-[3.75rem]"
                >
                  Ask in English.
                  <br />
                  <span className="text-foreground/85">Ship evidence.</span>
                </motion.h1>
                <motion.p
                  variants={heroLine}
                  className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl"
                >
                  Natural language becomes read-only SQL, executed on allowlisted
                  commerce data, returned as narrative + tables + charts + the
                  exact query-so teams move fast without giving up reviewability.
                </motion.p>
                <motion.div
                  variants={heroLine}
                  className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
                >
                  {isActive ? (
                    <motion.div
                      whileHover={reduce ? undefined : { y: -2 }}
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="inline-flex"
                    >
                      <Link
                        to="/analyze"
                        className={cn(
                          buttonVariants({ size: "lg" }),
                          "h-12 min-w-[10rem] justify-center rounded-full px-8 text-base shadow-sm transition-shadow hover:shadow-md",
                        )}
                      >
                        Open Analyze
                        <ArrowRight className="ml-2 size-4" aria-hidden />
                      </Link>
                    </motion.div>
                  ) : isPending ? (
                    <motion.div
                      whileHover={reduce ? undefined : { y: -2 }}
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="inline-flex"
                    >
                      <Link
                        to="/pending"
                        className={cn(
                          buttonVariants({ size: "lg" }),
                          "h-12 min-w-[10rem] justify-center rounded-full px-8 text-base shadow-sm transition-shadow hover:shadow-md",
                        )}
                      >
                        Account status
                        <ArrowRight className="ml-2 size-4" aria-hidden />
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={reduce ? undefined : { y: -2 }}
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="inline-flex"
                    >
                      <Link
                        to={`/login?next=${NEXT_ANALYZE}`}
                        className={cn(
                          buttonVariants({ size: "lg" }),
                          "h-12 min-w-[10rem] justify-center rounded-full px-8 text-base shadow-sm transition-shadow hover:shadow-md",
                        )}
                      >
                        Sign in to Analyze
                        <ArrowRight className="ml-2 size-4" aria-hidden />
                      </Link>
                    </motion.div>
                  )}
                  <motion.div
                    whileHover={reduce ? undefined : { y: -2 }}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    className="inline-flex"
                  >
                    <Link
                      to="/demo"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "h-12 justify-center rounded-full border-border/80 bg-background/50 px-8 text-base backdrop-blur transition-shadow hover:shadow-sm",
                      )}
                    >
                      Try demo
                    </Link>
                  </motion.div>
                  <Link
                    to="/governance"
                    className="text-base font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:ml-1"
                  >
                    How governance works
                  </Link>
                </motion.div>
                <motion.p
                  variants={heroLine}
                  className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  <span className="font-semibold text-foreground">Demo</span> uses
                  saved snapshots-no API key.{" "}
                  <span className="font-semibold text-foreground">Live</span> runs
                  the model on the sample database after sign-in.
                </motion.p>
              </motion.div>
            </motion.div>
            <motion.div variants={item} className="min-w-0">
              <HeroProductVisual />
            </motion.div>
          </div>

          {/* Stat strip: uses typography + dividers, not cards */}
          <motion.div
            variants={item}
            className="mt-16 grid grid-cols-1 divide-y divide-border border-y border-border/70 bg-muted/20 py-0 sm:mt-20 md:grid-cols-3 md:divide-x md:divide-y-0"
          >
            {[
              { k: "Execution", v: "Read-only SQL only" },
              { k: "Evidence", v: "Answer + table + query" },
              { k: "Policy", v: "Column rules & masking" },
            ].map((s, i) => (
              <motion.div
                key={s.k}
                className="px-2 py-5 text-center md:px-4 md:py-6"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: i * 0.1, duration: 0.45, ease: easeOut }}
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {s.k}
                </p>
                <p className="mt-1.5 font-display text-base font-medium text-foreground sm:text-lg">
                  {s.v}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Bento: one cohesive grid instead of four identical cards */}
        <section className="border-t border-border/60 bg-gradient-to-b from-background via-muted/10 to-background py-20 md:py-28">
          <div className={shell}>
            <FadeIn className="mx-auto max-w-3xl text-center" y={12}>
              <SectionTitle
                align="center"
                lead="One results surface: stakeholders see the story; reviewers see the proof."
              >
                What you get
              </SectionTitle>
            </FadeIn>
            <motion.ul
              className="mt-12 grid auto-rows-[minmax(7rem,auto)] gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2 lg:gap-5"
              variants={listRevealParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-10% 0px" }}
            >
              {whatYouGet.map((w) => {
                const Icon = w.icon;
                return (
                  <motion.li
                    key={w.title}
                    variants={bentoItem}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm ring-1 ring-foreground/[0.03] sm:p-7 dark:bg-card/50",
                      w.bento,
                    )}
                    whileHover={
                      reduce
                        ? undefined
                        : { y: -4, transition: { type: "spring", stiffness: 400, damping: 24 } }
                    }
                  >
                    <motion.div
                      className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/5"
                      whileHover={reduce ? undefined : { scale: 1.08, opacity: 0.9 }}
                    />
                    <Icon
                      className="relative size-6 text-foreground/80 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden
                    />
                    <h3 className="relative mt-4 font-display text-lg font-medium text-foreground">
                      {w.title}
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                      {w.body}
                    </p>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        </section>

        {/* How it works: full-bleed subtle band, steps as columns */}
        <section className="py-20 md:py-24">
          <div className={shell}>
            <FadeIn>
              <SectionTitle lead="From intent to inspectable output in three beats.">
                How it works
              </SectionTitle>
            </FadeIn>
            <motion.ol
              className="mt-12 grid gap-0 md:mt-16 md:grid-cols-3"
              variants={listRevealParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-8% 0px" }}
            >
              {workflow.map((s, i) => (
                <motion.li
                  key={s.title}
                  variants={listRevealItem}
                  className="border-b border-border/60 py-8 first:pt-0 last:border-b-0 md:border-b-0 md:border-l md:py-0 md:pl-10 md:pr-4 first:md:border-l-0 first:md:pl-0 md:pr-6 lg:pl-12 lg:pr-8"
                >
                  <motion.span
                    className="font-mono text-xs font-semibold tabular-nums text-primary"
                    initial={reduce ? false : { opacity: 0, scale: 0.5 }}
                    whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 + 0.1, type: "spring", stiffness: 500, damping: 22 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.span>
                  <h3 className="mt-3 font-display text-xl font-medium text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* Team: two-column list, light separators */}
        <section className="border-t border-border/60 py-20 md:py-24">
          <div className={shell}>
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              <FadeIn className="lg:col-span-4">
                <SectionTitle lead="One runtime-different questions by function.">
                  Who it is for
                </SectionTitle>
              </FadeIn>
              <motion.ul
                className="space-y-0 divide-y divide-border/70 lg:col-span-8"
                variants={listRevealParent}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-6% 0px" }}
              >
                {personas.map((u) => {
                  const Icon = u.icon;
                  return (
                    <motion.li
                      key={u.title}
                      variants={listRevealItem}
                      className="flex gap-4 py-6 first:pt-0 sm:gap-5 sm:py-7"
                      whileHover={reduce ? undefined : { x: 4 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    >
                      <motion.div
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30"
                        whileHover={reduce ? undefined : { scale: 1.06 }}
                      >
                        <Icon
                          className="size-[1.15rem] text-foreground/85"
                          aria-hidden
                        />
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg font-medium text-foreground">
                          {u.title}
                        </h3>
                        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
                          {u.body}
                        </p>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </div>
          </div>
        </section>

        {/* Trust: atmospheric strip */}
        <section className="border-y border-border/60 bg-foreground/[0.03] py-20 dark:bg-foreground/[0.06] md:py-24">
          <div className={shell}>
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-start">
              <FadeIn>
                <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                  Trust, by design
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Validation and policy add structure around the model-not a
                  guarantee it never drifts, but a clear line between proposal
                  and execution.
                </p>
                <motion.div
                  className="mt-6"
                  whileHover={reduce ? undefined : { x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
                    to="/governance"
                    className="inline-flex text-base font-semibold text-foreground underline-offset-4 transition-colors hover:underline"
                  >
                    Read the governance guide →
                  </Link>
                </motion.div>
              </FadeIn>
              <motion.ul
                className="space-y-4"
                variants={listRevealParent}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-5% 0px" }}
              >
                {trustBullets.map((t) => (
                  <motion.li
                    key={t}
                    variants={listRevealItem}
                    className="flex gap-3 text-base leading-relaxed text-foreground/85"
                  >
                    <motion.span
                      className="mt-0.5 inline-flex shrink-0"
                      whileHover={reduce ? undefined : { rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 0.45 }}
                    >
                      <LockKeyhole
                        className="size-5 text-foreground/60"
                        aria-hidden
                      />
                    </motion.span>
                    <span>{t}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </div>
        </section>

        {/* Architecture: loose grid, lighter frames */}
        <section className="py-20 md:py-24">
          <div className={shell}>
            <FadeIn>
              <SectionTitle lead="Compose today; extend to your warehouse and semantic layer later.">
                Under the hood
              </SectionTitle>
            </FadeIn>
            <motion.div
              className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4"
              variants={listRevealParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-8% 0px" }}
            >
              {architecture.map((a) => {
                const Icon = a.icon;
                return (
                  <motion.div
                    key={a.title}
                    variants={bentoItem}
                    className="rounded-2xl border border-border/50 bg-gradient-to-b from-card/90 to-card/30 p-6"
                    whileHover={reduce ? undefined : { y: -3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  >
                    <Icon
                      className="size-5 text-foreground/75"
                      aria-hidden
                    />
                    <h3 className="mt-4 font-display text-base font-medium text-foreground">
                      {a.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {a.body}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* FAQ: list + dividers */}
        <section className="border-t border-border/60 py-20 md:py-24">
          <div className={cn(shell, "max-w-4xl")}>
            <FadeIn y={12}>
              <SectionTitle
                align="center"
                lead="Straight answers before you sign in or open the demo."
              >
                Common questions
              </SectionTitle>
            </FadeIn>
            <motion.dl
              className="mt-12 divide-y divide-border/80 sm:mt-16"
              variants={listRevealParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-5% 0px" }}
            >
              {faq.map((f) => (
                <motion.div
                  key={f.q}
                  variants={listRevealItem}
                  className="py-6 first:pt-0 sm:py-7"
                >
                  <dt className="font-display text-lg font-medium text-foreground">
                    {f.q}
                  </dt>
                  <dd className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {f.a}
                  </dd>
                </motion.div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* CTA band: full-bleed */}
        <motion.section
          className="w-full border-t border-border/60 bg-primary text-primary-foreground"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: easeOut }}
        >
          <div
            className={cn(
              shell,
              "flex flex-col gap-8 py-12 sm:py-14 md:flex-row md:items-center md:justify-between md:gap-12 md:py-16 lg:py-20",
            )}
          >
            <div className="max-w-2xl">
              <p className="font-display text-2xl font-medium sm:text-3xl">
                {isActive
                  ? "Continue in the workspace"
                  : isPending
                    ? "We will email when your account is active"
                    : "Ready when you are"}
              </p>
              <p className="mt-2 text-base leading-relaxed text-primary-foreground/90">
                {isActive
                  ? "Run governed queries, export tables, and review SQL alongside answers."
                  : isPending
                    ? "You can still explore the demo while an administrator approves access."
                    : "Sign in to run the agent on the sample database, or open the demo for an instant product tour."}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-3">
              {isActive ? (
                <motion.div
                  whileHover={reduce ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="inline-flex"
                >
                  <Link
                    to="/analyze"
                    className={cn(
                      buttonVariants({ size: "lg", variant: "secondary" }),
                      "h-12 rounded-full border-0 bg-background px-6 text-foreground shadow-sm hover:bg-muted",
                    )}
                  >
                    Open Analyze
                    <ArrowRight className="ml-2 size-4" aria-hidden />
                  </Link>
                </motion.div>
              ) : isPending ? (
                <motion.div
                  whileHover={reduce ? undefined : { y: -2 }}
                  className="inline-flex"
                >
                  <Link
                    to="/pending"
                    className={cn(
                      buttonVariants({ size: "lg", variant: "secondary" }),
                      "h-12 rounded-full border-0 bg-background px-6 text-foreground shadow-sm hover:bg-muted",
                    )}
                  >
                    View status
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={reduce ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  className="inline-flex"
                >
                  <Link
                    to={`/login?next=${NEXT_ANALYZE}`}
                    className={cn(
                      buttonVariants({ size: "lg", variant: "secondary" }),
                      "h-12 rounded-full border-0 bg-background px-6 text-foreground shadow-sm hover:bg-muted",
                    )}
                  >
                    Sign in
                    <ArrowRight className="ml-2 size-4" aria-hidden />
                  </Link>
                </motion.div>
              )}
              <motion.div
                whileHover={reduce ? undefined : { y: -2 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                className="inline-flex"
              >
                <Link
                  to="/demo"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-12 rounded-full border-primary-foreground/50 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10",
                  )}
                >
                  Open demo
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.footer
          className={cn(
            shell,
            "flex flex-col items-center justify-between gap-4 border-t border-border/60 py-10 text-sm text-muted-foreground sm:flex-row sm:py-12 sm:text-base",
          )}
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45, ease: easeOut }}
        >
          <p className="text-center sm:text-left">
            InsightPilot - natural language to governed SQL, with evidence your
            team can review.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8"
            aria-label="Footer"
          >
            {[
              { to: "/governance", label: "Governance" },
              { to: "/demo", label: "Demo" },
              { to: "/login", label: "Sign in" },
            ].map((l) => (
              <motion.div key={l.to} whileHover={reduce ? undefined : { y: -1 }}>
                <Link
                  to={l.to}
                  className="font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </nav>
        </motion.footer>
      </div>
    </motion.div>
  );
}
