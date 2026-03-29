import type { LoginResponse } from "@/lib/contracts";

const TOKEN_KEY = "store-analytics.access-token";
const SESSION_KEY = "store-analytics.session";

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
