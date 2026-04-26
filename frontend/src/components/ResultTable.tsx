import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;

function filterRows(rows: Row[], query: string): Row[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    Object.values(row).some((v) => {
      if (v == null) return false;
      return String(v).toLowerCase().includes(q);
    }),
  );
}

export function ResultTable({
  rows,
  exportFilename = "olist-results.csv",
}: {
  rows: Row[];
  exportFilename?: string;
}) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(
    () => filterRows(rows ?? [], filter),
    [rows, filter],
  );

  if (!rows?.length) {
    return (
      <p className="text-[15px] text-muted-foreground">
        No rows returned for this query.
      </p>
    );
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="block flex-1">
          <span className="sr-only">Filter table rows</span>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter rows (matches any column)"
            className={cn(
              "h-10 w-full rounded-lg border border-border/80 bg-background/60 px-3 text-[15px] text-foreground placeholder:text-muted-foreground/75",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 self-start sm:self-auto"
          disabled={filtered.length === 0}
          onClick={() => downloadCsv(filtered, exportFilename)}
        >
          <Download className="size-3.5" aria-hidden />
          Export CSV
        </Button>
      </div>
      {filtered.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">
          No rows match this filter. Clear the filter to see all{" "}
          {rows.length} rows.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {rows.length} rows
          {filter.trim() ? " (filtered)" : ""}.
        </p>
      )}
      {filtered.length > 0 && (
        <ScrollArea className="h-[min(28rem,50vh)] w-full rounded-lg border border-border/60">
          <table className="w-full min-w-[28rem] border-collapse text-left text-[15px]">
            <thead className="sticky top-0 z-[1] bg-muted/90 backdrop-blur-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border-b border-border/60 px-3 py-2.5 font-medium text-muted-foreground"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-border/40 transition-colors",
                    i % 2 === 0 ? "bg-background/40" : "bg-muted/20",
                    "hover:bg-muted/40",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="max-w-[20rem] truncate px-3 py-2.5 font-mono text-[13px] text-foreground/90 md:text-sm"
                      title={row[col] != null ? String(row[col]) : ""}
                    >
                      {row[col] != null ? String(row[col]) : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  );
}
