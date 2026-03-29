import type { ReactNode } from "react";
import Link from "next/link";

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function AppShell({ eyebrow, title, description, action, children }: AppShellProps) {
  return (
    <div className="page-shell">
      <div className="container" style={{ display: "grid", gap: 24 }}>
        <header className="card subtle-grid" style={{ padding: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap"
            }}
          >
            <div style={{ maxWidth: 720, display: "grid", gap: 14 }}>
              <div className="pill" style={{ width: "fit-content" }}>
                <strong>{eyebrow}</strong>
                <span>Take-home starter</span>
              </div>
              <h1 style={{ margin: "10px 0 12px", fontSize: "clamp(2rem, 4vw, 4rem)", lineHeight: 1.02 }}>
                {title}
              </h1>
              <p style={{ margin: 0, maxWidth: 640, fontSize: "1.05rem", color: "var(--muted)" }}>{description}</p>
            </div>
            <div className="hero-actions">
              <Link href="/login" className="pill" style={{ color: "var(--text)" }}>
                Login
              </Link>
              {action}
            </div>
          </div>
        </header>

        <main style={{ display: "grid", gap: 24 }}>{children}</main>
      </div>
    </div>
  );
}
