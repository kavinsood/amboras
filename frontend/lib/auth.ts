import type { LoginResponse } from "@/lib/contracts";

const TOKEN_KEY = "store-analytics.access-token";
const SESSION_KEY = "store-analytics.session";
const VISITOR_KEY = "store-analytics.visitor-id";

export function readAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function writeAccessToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function readSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Pick<LoginResponse, "user" | "store">) : null;
}

export function writeSession(session: Pick<LoginResponse, "user" | "store">) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

export function readOrCreateVisitorId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.localStorage.getItem(VISITOR_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(VISITOR_KEY, generated);
  return generated;
}
