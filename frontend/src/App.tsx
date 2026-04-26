import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAnalyze } from "./components/RequireAnalyze";
import { SiteHeader } from "./components/SiteHeader";
import HomePage from "./pages/HomePage";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const GovernancePage = lazy(() => import("./pages/GovernancePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PendingPage = lazy(() => import("./pages/PendingPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ToolPage = lazy(() => import("./pages/ToolPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>Loading…</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <SiteHeader />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pending" element={<PendingPage />} />
            <Route path="/demo" element={<ToolPage mode="demo" />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="/analyze"
              element={
                <RequireAnalyze>
                  <ToolPage />
                </RequireAnalyze>
              }
            />
            <Route path="/governance" element={<GovernancePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}
