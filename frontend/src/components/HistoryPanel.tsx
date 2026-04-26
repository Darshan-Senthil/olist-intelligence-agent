import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HistoryEntry } from "@/lib/sessionHistory";
import { clearHistory } from "@/lib/sessionHistory";
import { cn } from "@/lib/utils";

function formatTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function HistoryPanel({
  entries,
  onRestore,
  onClear,
  className,
}: {
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border-border bg-card/90 shadow-sm ring-1 ring-border/60 backdrop-blur",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-foreground">
              <History className="size-5 opacity-80" aria-hidden />
              Session history
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Stored in this browser tab only. Clears when you close the tab.
            </CardDescription>
          </div>
          {entries.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={() => {
                clearHistory();
                onClear();
              }}
            >
              <Trash2 className="mr-1.5 size-3.5" aria-hidden />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {entries.length === 0 ? (
          <p className="text-base leading-relaxed text-muted-foreground">
            Run a query to build history. You can reopen past answers here.
          </p>
        ) : (
          <ScrollArea className="h-[min(16rem,36vh)] pr-3">
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onRestore(e)}
                    className={cn(
                      "w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 text-left transition-colors",
                      "hover:border-border hover:bg-muted/30",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    )}
                  >
                    <p className="line-clamp-2 text-sm leading-snug text-foreground sm:text-base">
                      {e.question}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatTime(e.ts)}
                      {e.truncated ? " · table rows truncated for storage" : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
