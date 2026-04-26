import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { Loader2, Shield } from "lucide-react";
import { Background } from "@/components/Background";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { approveUser, fetchAdminUsers, patchUserClearance } from "@/lib/api";
import { formatError } from "@/lib/formatError";
import { cn } from "@/lib/utils";

const CLEARANCES = ["public", "internal", "restricted"] as const;

export default function AdminPage() {
  const reduce = useReducedMotion();
  const { token, user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = (await fetchAdminUsers()) as AuthUser[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(formatError(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && token && user?.role === "admin") void load();
  }, [authLoading, token, user, load]);

  if (!authLoading && !token) {
    return <Navigate to="/login?next=/admin" replace />;
  }

  if (!authLoading && user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div
      className="relative min-h-[calc(100vh-4rem)]"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Background />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 gap-1">
              <Shield className="size-3.5" aria-hidden />
              Admin
            </Badge>
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
              Users & data access
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Approve new accounts and set each user&apos;s{" "}
              <span className="font-medium text-foreground">
                data_clearance
              </span>{" "}
              (how sensitive columns may appear in their query results).
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/analyze">Analyze</Link>
          </Button>
        </div>

        <Card className="border-border bg-card/95 shadow-sm ring-1 ring-border/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Accounts</CardTitle>
            <CardDescription>
              Pending users cannot run live queries when the API requires
              authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {err && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {err}
              </p>
            )}
            {loading || authLoading ? (
              <div className="flex items-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Loading users…
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Clearance</th>
                      <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border/80 last:border-0"
                      >
                        <td className="px-3 py-2.5 font-mono text-xs sm:text-sm">
                          {u.email}
                        </td>
                        <td className="px-3 py-2.5">{u.role}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              u.status === "active"
                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                                : "bg-amber-500/15 text-amber-900 dark:text-amber-100",
                            )}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            className="h-9 max-w-[11rem] rounded-md border border-input bg-background px-2 text-sm"
                            value={u.data_clearance}
                            onChange={async (e) => {
                              const v = e.target.value;
                              try {
                                await patchUserClearance(u.id, v);
                                await load();
                              } catch (ex) {
                                setErr(formatError(ex));
                              }
                            }}
                            aria-label={`Data clearance for ${u.email}`}
                          >
                            {CLEARANCES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          {u.status === "pending" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                try {
                                  await approveUser(u.id);
                                  await load();
                                } catch (ex) {
                                  setErr(formatError(ex));
                                }
                              }}
                            >
                              Approve
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length === 0 && !err && (
                  <p className="px-3 py-8 text-center text-muted-foreground">
                    No users yet. Register from the app or set bootstrap admin
                    env vars.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
