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
      className="form-stack"
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
      <div className="chip" style={{ justifyContent: "space-between" }}>
        <span>Seeded demo account</span>
        <strong>owner1@example.com / password123</strong>
      </div>

      <label className="form-label">
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@example.com"
          className="form-input"
        />
      </label>

      <label className="form-label">
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="password123"
          className="form-input"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className="primary-button auth-submit"
      >
        {status === "loading" ? "Signing in..." : "Sign in"}
      </button>

      {error ? (
        <div className="error-state" style={{ padding: 16 }}>
          <strong className="error-state-title">Sign-in failed</strong>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
            {error} Check the backend is running, then try the seeded demo account again.
          </p>
        </div>
      ) : null}
    </form>
  );
}
