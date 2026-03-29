import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <AppShell
      eyebrow="Dashboard"
      title="Everything important, at a glance."
      description="This dashboard is live against the Nest API: KPI cards read rollups, recent activity reads raw events, and the revenue trend comes from the same aggregate tables used for fast merchant reads."
      action={<span className="pill">Overview 15s • Activity 5s</span>}
    >
      <DashboardClient />
    </AppShell>
  );
}
