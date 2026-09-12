// Generic HTTP client for talking to the backend REST API.
// Uses the browser's native fetch — no extra dependency, smaller
// attack surface, nothing pulled from a third-party CDN.

import { getToken, clearSession } from "../utils/tokenStorage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const DEFAULT_TIMEOUT_MS = 8000;

// Lets callers (e.g. an AuthContext) register a callback that fires
// whenever a request comes back 401, instead of/alongside listening
// for the "auth:unauthorized" window event below. Either pattern works.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function request(method, path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (res.status === 401) {
      // Token missing/expired/invalid — drop the stale session and let
      // the app fall back to the login screen.
      clearSession();
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      if (unauthorizedHandler) unauthorizedHandler();
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const message = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${message}`);
    }

    if (res.status === 204) return null;
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const httpClient = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
