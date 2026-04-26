export function formatError(err: unknown): string {
  const e = err as {
    response?: { data?: unknown; status?: number };
    message?: string;
    code?: string;
  };
  if (!e?.response) {
    const msg = e?.message || "";
    const code = e?.code || "";
    if (
      code === "ERR_NETWORK" ||
      code === "ECONNREFUSED" ||
      msg === "Network Error"
    ) {
      return (
        "Cannot reach the API. Start the server on port 8010: " +
        "uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8010 " +
        "(same port as in frontend/vite.config.js)."
      );
    }
    if (code === "ECONNABORTED" || msg.includes("timeout")) {
      return "Request timed out. Try again.";
    }
    return msg || "Request failed";
  }
  const d = e.response.data;
  const status = e.response.status;
  if (typeof d === "string") return d;
  if (
    d &&
    typeof d === "object" &&
    "error" in d &&
    "detail" in d &&
    typeof (d as { error: unknown }).error === "string"
  ) {
    const o = d as { error: string; detail: string };
    return status
      ? `[${status}] ${o.error}: ${o.detail}`
      : `${o.error}: ${o.detail}`;
  }
  if (d && typeof d === "object" && "detail" in d) {
    const detail = (d as { detail: unknown }).detail;
    const text = Array.isArray(detail)
      ? detail.map((x: { msg?: string }) => x.msg || JSON.stringify(x)).join("; ")
      : String(detail);
    return status ? `[${status}] ${text}` : text;
  }
  return status ? `[${status}] Request failed` : "Request failed";
}
