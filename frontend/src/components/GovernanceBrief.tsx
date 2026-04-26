import { Link } from "react-router-dom";
import { Database, Eye, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const points = [
  {
    icon: Shield,
    title: "Read-only SQL",
    body: "Destructive statements are blocked. Queries run only after validation.",
  },
  {
    icon: Database,
    title: "Allowed schema",
    body: "The agent can only use tables that are explicitly approved for this workspace.",
  },
  {
    icon: Eye,
    title: "Result masking",
    body: "Sensitive columns can be masked in table output according to a published column policy.",
  },
  {
    icon: Lock,
    title: "Session stays local",
    body: "Query history is stored in this browser only. It clears when you close the tab.",
  },
];

export function GovernanceBrief() {
  return (
    <div className="space-y-6">
      <ul className="space-y-5">
        {points.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <Icon
              className="mt-0.5 size-5 shrink-0 text-foreground/85"
              aria-hidden
            />
            <div>
              <p className="text-base font-medium text-foreground">{title}</p>
              <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
        <Link to="/governance">Open full governance guide</Link>
      </Button>
    </div>
  );
}
