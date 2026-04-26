import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * FastAPI URL for `POST /api/ask` → proxied to `{target}/ask`.
 * Default 8010. Change here and match `uvicorn --port` if this port is taken.
 */
const API_PROXY_TARGET = "http://127.0.0.1:8010";

const apiProxy = {
  "/api": {
    target: API_PROXY_TARGET,
    changeOrigin: true,
    /** Align with axios timeout so the dev server does not wait forever on a hung LLM call */
    timeout: 130_000,
    proxyTimeout: 130_000,
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
};

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
});
