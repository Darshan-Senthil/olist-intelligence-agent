import { useEffect, useState } from "react";
import { Database, ChevronDown, Shield } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getCatalogUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type CatalogColumn = {
  name: string;
  description?: string;
  sensitivity?: string;
  mask?: string;
};

type CatalogTable = {
  name: string;
  description?: string;
  columns?: CatalogColumn[];
};

type CatalogPayload = {
  version?: string;
  tables?: CatalogTable[];
};

function sensitivityVariant(s: string | undefined) {
  const v = (s || "public").toLowerCase();
  if (v === "restricted")
    return "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200";
  if (v === "internal")
    return "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100";
  return "border-border bg-muted/50 text-foreground";
}

export function DataCatalogPanel({
  className,
  /** When true, catalog body starts expanded (loads policy on first open). */
  defaultOpen = false,
}: {
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [data, setData] = useState<CatalogPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: payload } = await axios.get<CatalogPayload>(getCatalogUrl(), {
          timeout: 30_000,
        });
        if (!cancelled) setData(payload);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Could not load data catalog.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, data]);

  return (
    <Card
      className={cn(
        "border-border bg-card/90 shadow-sm ring-1 ring-border/60 backdrop-blur",
        className,
      )}
    >
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
            <Database className="size-5 opacity-80" aria-hidden />
            Data catalog and privacy
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1 text-muted-foreground"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide" : "Show"}
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </Button>
        </div>
        <CardDescription className="flex flex-wrap items-center gap-2 text-base leading-relaxed">
          <Shield className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          Approved tables and how sensitive fields are masked in results (policy-driven).
        </CardDescription>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3 pt-0">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!error && !data && (
            <p className="text-sm text-muted-foreground">Loading catalog…</p>
          )}
          {data && (
            <>
              <p className="text-sm text-muted-foreground">
                Policy version:{" "}
                <span className="font-medium text-foreground">
                  {data.version ?? "n/a"}
                </span>
              </p>
              <ScrollArea className="h-[min(22rem,50vh)] pr-3">
                <ul className="space-y-4">
                  {(data.tables ?? []).map((t) => (
                    <li key={t.name}>
                      <p className="font-medium text-foreground">{t.name}</p>
                      {t.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground sm:text-base">
                          {t.description}
                        </p>
                      )}
                      <ul className="mt-2 space-y-1.5 border-l border-border/80 pl-3">
                        {(t.columns ?? []).map((c) => (
                          <li
                            key={`${t.name}.${c.name}`}
                            className="flex flex-wrap items-baseline gap-2 text-sm sm:text-base"
                          >
                            <span className="font-mono text-sm text-foreground">
                              {c.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-normal uppercase tracking-wide",
                                sensitivityVariant(c.sensitivity),
                              )}
                            >
                              {c.sensitivity ?? "public"}
                            </Badge>
                            {c.mask && c.mask !== "none" && (
                              <span className="text-muted-foreground">
                                mask: {c.mask}
                              </span>
                            )}
                            {c.description && (
                              <span className="w-full text-muted-foreground">
                                {c.description}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
