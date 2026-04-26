import { motion, useReducedMotion } from "framer-motion";
import { LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-3.5 py-2 text-sm font-medium transition-all",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:bg-background hover:text-foreground",
  );

const signInClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "rounded-full border-border/80 px-4 font-medium shadow-sm",
    isActive && "border-primary/40 bg-primary/5 text-foreground",
  );

export function SiteHeader() {
  const reduce = useReducedMotion();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const hideSignInCta =
    !user && (pathname === "/login" || pathname === "/register");

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-border/70 bg-background/75 px-4 py-3 backdrop-blur-xl md:px-8"
    >
      <div className="mx-auto flex w-full max-w-[min(100rem,calc(100%-2rem))] items-center justify-between gap-4 px-0 sm:px-2">
        <NavLink
          to="/"
          className="group inline-flex items-center gap-2 font-display text-xl font-medium tracking-tight text-foreground"
        >
          <span>InsightPilot</span>
          <span className="hidden rounded-full border border-border/80 bg-card/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:inline-flex">
            Beta
          </span>
        </NavLink>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <nav
            className="hidden min-w-0 items-center gap-1 rounded-full border border-border/70 bg-muted/50 p-1 md:flex md:flex-wrap md:justify-end"
            aria-label="Primary"
          >
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            {user ? (
              <NavLink to="/analyze" className={navLinkClass}>
                Analyze
              </NavLink>
            ) : (
              <NavLink to="/login?next=%2Fanalyze" className={navLinkClass}>
                Analyze
              </NavLink>
            )}
            <NavLink to="/governance" className={navLinkClass}>
              Governance
            </NavLink>
            <NavLink to="/demo" className={navLinkClass}>
              Demo
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>
          <div
            className="flex shrink-0 items-center gap-2 border-border pl-2 sm:border-l sm:pl-3"
            aria-label="Account"
          >
            {user ? (
              <>
                <span
                  className="hidden max-w-[12rem] truncate rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground lg:inline"
                  title={user.email}
                >
                  {user.email}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full px-3 text-sm"
                  onClick={() => logout()}
                >
                  <LogOut className="size-3.5 opacity-80" aria-hidden />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : hideSignInCta ? null : (
              <NavLink to="/login" className={signInClass}>
                Sign in
              </NavLink>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
      <nav
        className="mx-auto mt-2 flex max-w-[min(100rem,calc(100%-2rem))] items-center gap-1 overflow-x-auto px-0 pb-1 sm:px-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Primary mobile"
      >
        <NavLink to="/" className={navLinkClass} end>
          Home
        </NavLink>
        {user ? (
          <NavLink to="/analyze" className={navLinkClass}>
            Analyze
          </NavLink>
        ) : (
          <NavLink to="/login?next=%2Fanalyze" className={navLinkClass}>
            Analyze
          </NavLink>
        )}
        <NavLink to="/governance" className={navLinkClass}>
          Governance
        </NavLink>
        <NavLink to="/demo" className={navLinkClass}>
          Demo
        </NavLink>
        {user?.role === "admin" && (
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        )}
      </nav>
    </motion.header>
  );
}
