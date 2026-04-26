import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Database,
  Eye,
  FileWarning,
  LockKeyhole,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Background } from "@/components/Background";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NEXT_ANALYZE = encodeURIComponent("/analyze");
const easeOut = [0.22, 1, 0.36, 1] as const;

/** Pixels from top of viewport: sticky header + breathing room for scroll spy. */
const SCROLL_MARK = 112;

function sectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const sections = [
  {
    icon: ShieldCheck,
    title: "What we mean by governance",
    body: "Governance here is the set of rules that limit what the AI can query, how SQL is checked before it runs, and how sensitive values may appear in your results. It is designed so business users can explore data without needing to memorize schema details, while technical reviewers can still inspect the exact query.",
  },
  {
    icon: Server,
    title: "SQL safety",
    body: "Generated SQL goes through validation aimed at read-only execution. Statements that could change or delete data are rejected. This reduces risk compared to pasting unconstrained AI output into a production database client.",
  },
  {
    icon: Database,
    title: "Allowed tables and scope",
    body: "The runtime uses an allowlist of tables the agent is permitted to touch. Questions that would require tables outside that list cannot be satisfied with a hidden join to unapproved data. The in-app data catalog summarizes approved tables and column sensitivity labels.",
  },
  {
    icon: Eye,
    title: "Column policy and masking",
    body: "Some fields may be treated as restricted or internal. When results include those columns, values can be masked or redacted according to a versioned column policy, so exports and screenshots are less likely to leak raw sensitive values. Policy version is reflected alongside results when masking applies.",
  },
  {
    icon: LockKeyhole,
    title: "Sessions and storage",
    body: "Session history of your questions and answers is kept in this browser (for example sessionStorage). It is not a substitute for enterprise audit logs on a shared server. Close the tab and that local history is cleared unless your browser is configured to restore sessions.",
  },
  {
    icon: BookOpen,
    title: "Transparency for reviewers",
    body: "Each successful run exposes the SQL that was executed and a tabular view of returned rows (after masking). That pairing is intentional: answers should be checkable against the evidence the system used.",
  },
  {
    icon: FileWarning,
    title: "Limits of this demo",
    body: "This project illustrates a pattern for governed analytics, not a complete enterprise security program. Network controls, identity, row-level authorization, and centralized logging still belong in your platform design. Use this app to evaluate workflow fit, not as legal or compliance advice.",
  },
];

const pageStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const revealItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: easeOut },
  },
};

function TocLink({
  id,
  title,
  isActive,
  onSelect,
}: {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.a
      href={`#${id}`}
      onClick={(e) => {
        e.preventDefault();
        onSelect(id);
      }}
      className={cn(
        "block rounded-md py-2 pl-3 pr-2 text-left text-sm transition-[color,background-color,border-color] duration-200 ease-out",
        "border-l-[3px]",
        isActive
          ? "border-primary bg-muted font-medium text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
      )}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
    >
      {title}
    </motion.a>
  );
}

export default function GovernancePage() {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const isActive = user?.status === "active";

  const sectionIds = useMemo(() => sections.map((s) => sectionId(s.title)), []);

  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return sectionIds[0];
    const h = window.location.hash.slice(1);
    return sectionIds.includes(h) ? h : sectionIds[0];
  });

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  }, [reduce]);

  useEffect(() => {
    const syncFromHash = () => {
      const h = window.location.hash.slice(1);
      if (h && sectionIds.includes(h)) setActiveId(h);
    };
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [sectionIds]);

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (!h || !sectionIds.includes(h)) return;
    const id = window.requestAnimationFrame(() => {
      scrollToId(h);
    });
    return () => window.cancelAnimationFrame(id);
  }, [sectionIds, scrollToId]);

  useEffect(() => {
    const updateActive = () => {
      let current = sectionIds[0];
      const y = window.scrollY + SCROLL_MARK;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) current = id;
      }
      setActiveId(current);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [sectionIds]);

  return (
    <motion.div
      className="relative min-h-screen"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: easeOut }}
    >
      <Background />
      <div className="relative z-10 mx-auto w-full max-w-[min(100rem,calc(100%-2rem))] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <motion.div
          className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-6"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
        >
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-base text-muted-foreground hover:text-foreground",
            )}
          >
            Home
          </Link>
          {isActive ? (
            <Link
              to="/analyze"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full text-base",
              )}
            >
              Open Analyze
            </Link>
          ) : (
            <Link
              to={`/login?next=${NEXT_ANALYZE}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full text-base",
              )}
            >
              Sign in
            </Link>
          )}
        </motion.div>

        <motion.header
          className="max-w-3xl"
          variants={revealItem}
          initial={reduce ? false : "hidden"}
          animate="show"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            InsightPilot
          </p>
          <h1 className="mt-2 font-display text-balance text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Data governance and security
          </h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            How this workspace limits queries, protects sensitive fields in results, and how
            local session data fits next to server-side controls you would add in production.
          </p>
        </motion.header>

        {/* Mobile: horizontal TOC, sticky under header */}
        <nav
          className="sticky top-[4.5rem] z-30 -mx-5 mb-10 border-b border-border/80 bg-background/90 px-5 py-3 backdrop-blur-md sm:top-[5rem] lg:hidden"
          aria-label="On this page"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            On this page
          </p>
          <ul className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((s) => {
              const id = sectionId(s.title);
              return (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollToId(id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                      activeId === id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    {s.title.length > 32 ? `${s.title.slice(0, 30)}...` : s.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <motion.div
          className="mt-8 lg:mt-12 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-12 xl:gap-16"
          variants={pageStagger}
          initial={reduce ? false : "hidden"}
          animate="show"
        >
          <nav className="mb-10 hidden lg:block" aria-label="On this page">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ul className="sticky top-28 mt-4 space-y-0.5 border-l border-border/80 pl-1">
              {sections.map((s) => {
                const id = sectionId(s.title);
                return (
                  <li key={id}>
                    <TocLink id={id} title={s.title} isActive={activeId === id} onSelect={scrollToId} />
                  </li>
                );
              })}
            </ul>
          </nav>

          <motion.div className="min-w-0 max-w-3xl" variants={revealItem}>
            {sections.map((s, i) => {
              const Icon = s.icon;
              const id = sectionId(s.title);
              return (
                <motion.article
                  key={s.title}
                  id={id}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2, margin: "-8% 0px -10% 0px" }}
                  transition={{ delay: reduce ? 0 : 0.03 * i, duration: 0.45, ease: easeOut }}
                  className="scroll-mt-32 border-b border-border/70 py-10 first:pt-0 last:border-0 sm:scroll-mt-36"
                >
                  <div className="flex gap-3 sm:gap-4">
                    <motion.span
                      className="mt-1 inline-flex shrink-0"
                      whileHover={reduce ? undefined : { rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.45 }}
                    >
                      <Icon
                        className="size-5 text-foreground/80 sm:size-6"
                        aria-hidden
                      />
                    </motion.span>
                    <div className="min-w-0">
                      <h2 className="font-display text-xl font-medium text-foreground sm:text-2xl">
                        {s.title}
                      </h2>
                      <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.footer
          className="mt-6 max-w-3xl border-t border-border/80 pt-10"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          <p className="text-base text-muted-foreground">
            {isActive
              ? "Run a governed query in the workspace when you are ready."
              : "Sign in for live Analyze, or try the demo without an account."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {isActive ? (
              <Link
                to="/analyze"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 rounded-full px-7 text-base",
                )}
              >
                Open Analyze
                <ArrowRight className="ml-2 size-4" aria-hidden />
              </Link>
            ) : (
              <Link
                to={`/login?next=${NEXT_ANALYZE}`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 rounded-full px-7 text-base",
                )}
              >
                Sign in to Analyze
                <ArrowRight className="ml-2 size-4" aria-hidden />
              </Link>
            )}
            <Link
              to="/demo"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 rounded-full px-7 text-base",
              )}
            >
              Open demo
            </Link>
          </div>
        </motion.footer>
      </div>
    </motion.div>
  );
}
