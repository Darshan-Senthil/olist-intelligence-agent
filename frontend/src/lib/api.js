import axios from "axios";

const TOKEN_KEY = "insightpilot_token";

/** API path: with Vite proxy use `/api` prefix; with `VITE_API_URL` call backend root paths. */
export function apiPath(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}${p}`;
  return `/api${p}`;
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * FastAPI POST /ask
 *
 * - Default: same-origin `/api/ask` → Vite proxy → backend (see vite.config.js)
 * - Override: `VITE_API_URL=http://127.0.0.1:8010` (no trailing slash) for direct calls
 */
export function getAskUrl() {
  return apiPath("/ask");
}

export function getCatalogUrl() {
  return apiPath("/catalog");
}

const publicClient = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

const client = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
});

client.interceptors.request.use((config) => {
  const t = getStoredToken();
  if (t) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export async function fetchAuthConfig() {
  const { data } = await publicClient.get(apiPath("/auth/config"));
  return data;
}

export async function loginRequest(email, password) {
  const { data } = await publicClient.post(apiPath("/auth/login"), {
    email,
    password,
  });
  return data;
}

export async function registerRequest(email, password) {
  const { data } = await publicClient.post(apiPath("/auth/register"), {
    email,
    password,
  });
  return data;
}

export async function fetchMe() {
  const { data } = await client.get(apiPath("/auth/me"));
  return data;
}

export async function fetchAdminUsers() {
  const { data } = await client.get(apiPath("/auth/admin/users"));
  return data;
}

export async function approveUser(userId) {
  const { data } = await client.post(
    apiPath(`/auth/admin/users/${userId}/approve`),
  );
  return data;
}

export async function patchUserClearance(userId, data_clearance) {
  const { data } = await client.patch(apiPath(`/auth/admin/users/${userId}`), {
    data_clearance,
  });
  return data;
}

export async function askQuestion(question) {
  const { data } = await client.post(getAskUrl(), { question });
  return data;
}
