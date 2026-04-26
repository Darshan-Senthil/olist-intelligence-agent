import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Background } from "@/components/Background";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { formatError } from "@/lib/formatError";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export default function RegisterPage() {
  const reduce = useReducedMotion();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setDone(null);
    setBusy(true);
    try {
      const { message } = await register(email.trim(), password);
      setDone(message);
      setPassword("");
    } catch (ex) {
      setErr(formatError(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="relative min-h-[calc(100vh-4rem)]"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Background />
      <div className="relative z-10 mx-auto max-w-md px-4 py-14 sm:px-6">
        <Card className="border-border bg-card/95 shadow-sm ring-1 ring-border/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-medium tracking-tight">
              Request access
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Create an account. An administrator verifies and activates it before you
              can use live governed queries (when the API requires authentication).
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              {done && (
                <p
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100"
                  role="status"
                >
                  {done}
                </p>
              )}
              {err && (
                <p
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {err}
                </p>
              )}
              <div className="space-y-2">
                <label htmlFor="reg-email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(inputClass)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-password" className="text-sm font-medium">
                  Password (at least 8 characters)
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(inputClass)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
                {busy ? "Submitting…" : "Register"}
              </Button>
              <Link
                to="/login"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Already have an account? Sign in
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </motion.div>
  );
}
