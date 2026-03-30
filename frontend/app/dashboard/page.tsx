import { DashboardClient } from "@/components/dashboard-client";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardClient />
    </DashboardShell>
  );
}
