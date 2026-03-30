import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function HomePage() {
  return (
    <AppShell
      eyebrow="Store analytics"
      title="Merchant analytics that feel live, fast, and trustworthy."
      description="Sign in, inspect the dashboard, and walk through a merchant-facing analytics experience built for speed, clarity, and believable live behavior."
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
      <section className="card subtle-grid" style={{ padding: 28, maxWidth: 760 }}>
        <p className="section-label">Demo flow</p>
        <h2 style={{ marginTop: 10, marginBottom: 12 }}>
          Open the seeded store, land in the dashboard, and review the metrics that matter first.
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: 58 + "ch" }}>
          The login page includes the demo credentials. From there, the dashboard shows revenue, conversion,
          product rankings, and recent activity with a refresh pattern that feels active without becoming noisy.
        </p>
      </section>
    </AppShell>
  );
}
