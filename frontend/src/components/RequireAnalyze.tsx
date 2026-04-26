import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RequireAnalyze({ children }: { children: React.ReactNode }) {
  const { loading, config, token, user } = useAuth();
  const location = useLocation();

  if (loading || !config) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <span>Loading…</span>
      </div>
    );
  }

  // Analyze is always account-gated in the product UI (independent of API auth_optional).
  if (!token || !user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
  if (user.status !== "active") {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
