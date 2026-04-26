import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Background } from "@/components/Background";
import { Button, buttonVariants } from "@/components/ui/button";
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

const ease = [0.22, 1, 0.36, 1] as const;

const trustPoints = [
  "Answers you can inspect-SQL, tables, and charts",
  "Governed database access, not a raw SQL console",
  "Admins approve new teammates when sign-in is required",
];

const inputClass = cn(
  "h-12 w-full rounded-xl border-2 border-border bg-background px-4 text-base text-foreground shadow-sm",
  "placeholder:text-muted-foreground/70",
  "transition-[border-color,box-shadow] duration-150",
  "outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
);

export default function LoginPage() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/analyze";
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(next.startsWith("/") ? next : "/analyze", { replace: true });
    } catch (ex) {
      setErr(formatError(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="relative min-h-[calc(100vh-4rem)]"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
    >
      <Background />
      <div className="relative z-10 mx-auto w-full max-w-[min(100rem,calc(100%-2rem))] px-4 py-10 sm:px-6 md:py-14 lg:px-10">
        <div className="mx-auto grid max-w-5xl items-stretch gap-10 lg:grid-cols-[minmax(0,1fr)_min(100%,420px)] lg:gap-14 xl:max-w-6xl xl:gap-20">
          {/* Story column - desktop first in reading order; stacks under form on small screens */}
          <motion.div
            className="order-2 flex flex-col justify-center lg:order-1"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.06 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              InsightPilot
            </p>
            <h1 className="mt-3 font-display text-balance text-3xl font-medium leading-[1.12] tracking-tight text-foreground sm:text-4xl md:text-[2.65rem]">
              Analytics your team can actually use
            </h1>
            <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Ask questions in plain language. Get answers with evidence-not a
              black box.
            </p>
            <ul className="mt-8 max-w-md space-y-3">
              {trustPoints.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 text-base leading-snug text-muted-foreground"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3.5 stroke-[2.5]" aria-hidden />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/demo"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 rounded-full border-2 px-6 font-medium",
                )}
              >
                <Sparkles className="mr-2 size-4 opacity-90" aria-hidden />
                Try the demo
              </Link>
              <Link
                to="/register"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "h-11 rounded-full px-4 font-medium text-muted-foreground hover:text-foreground",
                )}
              >
                Need an account?
                <ArrowRight className="ml-1.5 size-4 opacity-80" aria-hidden />
              </Link>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              <Link
                to="/"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                ← Home
              </Link>
              <span className="mx-2 text-border">·</span>
              <Link
                to="/governance"
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                Security & governance
              </Link>
            </p>
          </motion.div>

          {/* Form - first on mobile */}
          <motion.div
            className="order-1 lg:order-2 lg:flex lg:justify-end"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <Card
              className={cn(
                "w-full border-2 border-border/90 bg-card/95 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] backdrop-blur-md",
                "dark:shadow-[0_24px_56px_-12px_rgba(0,0,0,0.65)]",
                "lg:max-w-[420px] lg:shadow-2xl",
              )}
            >
              <CardHeader className="space-y-1 border-b border-border/60 px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
                <CardTitle className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
                  Sign in
                </CardTitle>
                <CardDescription className="text-base leading-relaxed text-muted-foreground">
                  Work email and password. Trouble signing in? Ask the person
                  who invited you-or try the demo while you wait.
                </CardDescription>
              </CardHeader>
              <form onSubmit={onSubmit} noValidate>
                <CardContent className="space-y-5 px-6 pb-2 pt-6 sm:px-8 sm:pt-8">
                  {err && (
                    <div
                      className="rounded-xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-sm leading-snug text-destructive"
                      role="alert"
                    >
                      {err}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label
                      htmlFor="login-email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email
                    </label>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="login-password"
                      className="text-sm font-medium text-foreground"
                    >
                      Password
                    </label>
                    <input
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-5 border-t border-border/50 bg-muted/20 px-6 py-6 sm:px-8">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={busy}
                    className="h-12 w-full rounded-xl text-base font-semibold shadow-sm"
                  >
                    {busy ? "Signing in…" : "Continue"}
                  </Button>
                  <div className="flex flex-col gap-3 text-center text-sm sm:flex-row sm:items-center sm:justify-center sm:gap-1 sm:text-left">
                    <Link
                      to="/register"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Create an account
                    </Link>
                    <span className="hidden text-muted-foreground sm:inline">
                      ·
                    </span>
                    <Link
                      to="/demo"
                      className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Explore without signing in
                    </Link>
                  </div>
                  <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
                    Administrators use this same sign-in. If your organization
                    requires approval, you will see next steps after you log in.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
