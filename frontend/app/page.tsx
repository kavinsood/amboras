import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function HomePage() {
  return (
    <AppShell
      eyebrow="Store analytics"
      title="Merchant analytics that feel live, fast, and trustworthy."
      description="A take-home implementation built around rollup-backed metrics, tenant-safe APIs, and a dashboard that gives store owners signal instead of noise."
      action={
        <>
          <Link href="/login" className="hero-button hero-button-primary">
            Sign in to demo
          </Link>
          <Link href="/dashboard" className="hero-button hero-button-secondary">
            View dashboard
          </Link>
        </>
      }
    >
      <section className="home-hero-grid">
        <article className="card subtle-grid" style={{ padding: 24 }}>
          <p className="section-label">Demo access</p>
          <h2 style={{ marginTop: 10, marginBottom: 12 }}>Seeded account is ready</h2>
          <div className="credential-row">
            <span>owner1@example.com</span>
            <strong>password123</strong>
          </div>
          <p style={{ margin: "14px 0 0", color: "var(--muted)" }}>
            The login flow is live against the Nest backend and stores a JWT-backed session for the dashboard.
          </p>
        </article>

        <article className="card" style={{ padding: 24 }}>
          <p className="section-label">What the dashboard answers</p>
          <div className="home-value-list">
            <div>
              <strong>How much am I making?</strong>
              <p>Total revenue for today, this week, and this month.</p>
            </div>
            <div>
              <strong>What is converting?</strong>
              <p>Purchase-to-page-view conversion plus top products by revenue.</p>
            </div>
            <div>
              <strong>What is happening right now?</strong>
              <p>Recent activity updates from raw events without a page refresh.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="kpi-grid">
        <article className="card" style={{ padding: 20 }}>
          <p style={{ margin: 0, color: "var(--muted)" }}>Backend shape</p>
          <strong style={{ display: "block", marginTop: 10, fontSize: "1.4rem" }}>Raw events + daily rollups</strong>
          <p style={{ margin: "10px 0 0", color: "var(--muted)" }}>Overview and product rankings read from aggregates. Recent activity reads directly from indexed raw events.</p>
        </article>
        <article className="card" style={{ padding: 20 }}>
          <p style={{ margin: 0, color: "var(--muted)" }}>Live behavior</p>
          <strong style={{ display: "block", marginTop: 10, fontSize: "1.4rem" }}>15s metrics, 5s activity</strong>
          <p style={{ margin: "10px 0 0", color: "var(--muted)" }}>The dashboard uses different refresh cadences so the most time-sensitive surface stays freshest.</p>
        </article>
        <article className="card" style={{ padding: 20 }}>
          <p style={{ margin: 0, color: "var(--muted)" }}>Safety</p>
          <strong style={{ display: "block", marginTop: 10, fontSize: "1.4rem" }}>Tenant-safe by default</strong>
          <p style={{ margin: "10px 0 0", color: "var(--muted)" }}>Store scope comes from authenticated user context, not from user-supplied query params.</p>
        </article>
        <article className="card" style={{ padding: 20 }}>
          <p style={{ margin: 0, color: "var(--muted)" }}>Demo signal</p>
          <strong style={{ display: "block", marginTop: 10, fontSize: "1.4rem" }}>Working ingest loop</strong>
          <p style={{ margin: "10px 0 0", color: "var(--muted)" }}>A new purchase event updates rollups, recent activity, and product rankings immediately.</p>
        </article>
      </section>

      <section className="two-col">
        <div className="card subtle-grid" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Why this approach stands out</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", display: "grid", gap: 10 }}>
            <li>Boring Postgres-first architecture instead of fake web-scale complexity</li>
            <li>Rollups where they matter, raw reads where they are cheap</li>
            <li>Clean local setup with Bun, Docker, and seeded demo data</li>
            <li>Frontend states that stay honest about freshness and failures</li>
          </ul>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Where to click first</h2>
          <p style={{ marginTop: 0, color: "var(--muted)" }}>
            Start on the login page, use the seeded account, and then jump into the dashboard to see live metrics, trend bars, recent activity, and product rankings.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
