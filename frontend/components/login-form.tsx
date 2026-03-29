"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, login } from "@/lib/api";
import { clearAccessToken, writeAccessToken, writeSession } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("owner1@example.com");
  const [password, setPassword] = useState("password123");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      style={{ display: "grid", gap: 16 }}
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("loading");
        setError(null);

        try {
          const response = await login({ email, password });
          clearAccessToken();
          writeAccessToken(response.accessToken);
          writeSession({
            user: response.user,
            store: response.store
          });
          router.push("/dashboard");
        } catch (error) {
          setStatus("error");
          setError(error instanceof ApiError ? error.message : "We could not sign you in right now.");
        }
      }}
    >
      <div className="pill" style={{ justifyContent: "space-between" }}>
        <span>Seeded demo account</span>
        <strong>owner1@example.com / password123</strong>
      </div>

      <label style={{ display: "grid", gap: 8 }}>
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@example.com"
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid var(--line)",
            background: "white"
          }}
        />
      </label>

      <label style={{ display: "grid", gap: 8 }}>
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="password123"
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid var(--line)",
            background: "white"
          }}
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "12px 16px",
          border: 0,
          borderRadius: 999,
          background: "linear-gradient(90deg, var(--accent), #dd8659)",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
          opacity: status === "loading" ? 0.72 : 1
        }}
      >
        {status === "loading" ? "Signing in..." : "Sign in"}
      </button>

      {error ? (
        <div className="card" style={{ padding: 16, borderColor: "rgba(184, 92, 56, 0.35)", background: "rgba(255,255,255,0.72)" }}>
          <strong style={{ color: "#b85c38" }}>Sign-in failed</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
            {error} Check the backend is running, then try the seeded demo account again.
          </p>
        </div>
      ) : null}
    </form>
  );
}
