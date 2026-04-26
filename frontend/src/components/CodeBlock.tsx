import { useMemo } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEYWORDS = new Set(
  [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP",
    "BY",
    "ORDER",
    "LIMIT",
    "JOIN",
    "LEFT",
    "RIGHT",
    "INNER",
    "ON",
    "AS",
    "AND",
    "OR",
    "WITH",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
    "DISTINCT",
    "HAVING",
    "IN",
    "NOT",
    "NULL",
  ].map((x) => x.toUpperCase()),
);

function formatSql(sql: string): string {
  const normalized = sql.replace(/\s+/g, " ").trim();
  const withBreaks = normalized
    .replace(/\bSELECT\b/gi, "\nSELECT")
    .replace(/\bFROM\b/gi, "\nFROM")
    .replace(/\bWHERE\b/gi, "\nWHERE")
    .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
    .replace(/\bORDER BY\b/gi, "\nORDER BY")
    .replace(/\bLIMIT\b/gi, "\nLIMIT")
    .replace(/\bHAVING\b/gi, "\nHAVING")
    .replace(/\b(LEFT|RIGHT|INNER)?\s*JOIN\b/gi, "\n$&")
    .replace(/\bON\b/gi, "\n  ON")
    .replace(/\bAND\b/gi, "\n  AND")
    .replace(/\bOR\b/gi, "\n  OR")
    .trim();
  return withBreaks.startsWith("SELECT") ? withBreaks : normalized;
}

function renderLineTokens(line: string) {
  const parts = line.match(/'(?:''|[^'])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|./g) ?? [line];

  return parts.map((part, i) => {
    const upper = part.toUpperCase();
    if (/^'(?:''|[^'])*'$/.test(part)) {
      return (
        <span key={i} className="text-amber-600 dark:text-amber-300">
          {part}
        </span>
      );
    }
    if (/^\d+(?:\.\d+)?$/.test(part)) {
      return (
        <span key={i} className="text-violet-600 dark:text-violet-300">
          {part}
        </span>
      );
    }
    if (KEYWORDS.has(upper)) {
      return (
        <span key={i} className="font-medium text-sky-600 dark:text-sky-300">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function CodeBlock({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const lines = useMemo(() => formatSql(code).split("\n"), [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* no-op */
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-muted/60",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          SQL
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleCopy}
        >
          <Copy className="size-3.5" aria-hidden />
          Copy
        </Button>
      </div>
      <div className="max-h-[min(26rem,48vh)] overflow-auto px-0 py-2">
        <div className="font-mono text-[13px] leading-relaxed md:text-sm">
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-[3.2rem_1fr] px-3">
              <span className="select-none pr-3 text-right text-muted-foreground/80">
                {idx + 1}
              </span>
              <span className="whitespace-pre-wrap break-words text-foreground/95">
                {renderLineTokens(line || " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
