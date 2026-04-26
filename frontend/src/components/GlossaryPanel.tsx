import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TOPICS = [
  "Orders: status, purchase and delivery dates, estimated delivery",
  "Customers: city, state, zip prefix; repeat buyers via unique customer id",
  "Line items: price per item, freight, product and seller per order",
  "Payments: type, installments, value per order (orders can have multiple payments)",
  "Products: category, size and weight fields, English names via translation",
  "Reviews: score and text tied to orders",
  "Sellers and geolocation for regional questions",
];

const GLOSSARY: { term: string; meaning: string }[] = [
  {
    term: "Revenue (here)",
    meaning:
      "Typically the sum of line item prices in order items, unless your question defines it differently.",
  },
  {
    term: "Order value",
    meaning:
      "Often total payments for an order; payments can be split across types or installments.",
  },
  {
    term: "Customer vs unique customer",
    meaning:
      "Each order has a customer id; the same person may have a stable unique id across orders.",
  },
  {
    term: "English categories",
    meaning:
      "Product categories can be shown in English using the category translation table when you ask in English.",
  },
  {
    term: "Delivery delay",
    meaning:
      "Difference between purchase time and delivered-to-customer time, when both exist.",
  },
];

export function GlossaryPanel({
  className,
  /** When true, topics and glossary start expanded (e.g. inside an orientation tab). */
  defaultOpen = false,
}: {
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

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
            <BookOpen className="size-5 opacity-80" aria-hidden />
            What you can ask
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
        <CardDescription className="text-base leading-relaxed">
          You do not need table or column names. Ask in plain language. The app
          maps your question to read-only SQL. Below is a quick map of what is in
          the dataset.
        </CardDescription>
      </CardHeader>
      {open && (
        <CardContent className="space-y-6 pt-0">
          <div>
            <h3 className="mb-2 text-base font-medium text-foreground">Topics</h3>
            <ul className="list-inside list-disc space-y-2 text-base leading-relaxed text-muted-foreground">
              {TOPICS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-base font-medium text-foreground">Glossary</h3>
            <dl className="space-y-4">
              {GLOSSARY.map(({ term, meaning }) => (
                <div key={term}>
                  <dt className="text-base font-medium text-foreground/95">
                    {term}
                  </dt>
                  <dd className="mt-1 text-base leading-relaxed text-muted-foreground">
                    {meaning}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
