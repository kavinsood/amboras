import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <AppShell
      eyebrow="Access"
      title="Sign in and inspect a live store."
      description="The seeded demo account logs into the real Nest backend, stores a session locally, and opens a merchant dashboard backed by Postgres rollups."
      action={
        <Link href="/" className="ghost-button">
          Back to home
        </Link>
      }
    >
      <div className="card" style={{ padding: 24, maxWidth: 520 }}>
        <LoginForm />
        <p style={{ margin: "16px 0 0", color: "var(--muted)" }}>
          Use the seeded demo account when the backend is live. The form will show loading and error states on submit.
        </p>
      </div>
    </AppShell>
  );
}
