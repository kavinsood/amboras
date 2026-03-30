import Link from "next/link";
import type { ReactNode } from "react";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="dashboard-frame">
      <header className="dashboard-topbar">
        <div className="dashboard-brand-group">
          <Link href="/" className="dashboard-brand">
            <span className="dashboard-brand-mark">SA</span>
            <span>
              <strong>Store Analytics</strong>
              <span className="dashboard-brand-copy">Operator-ready merchant dashboard</span>
            </span>
          </Link>
        </div>

        <div className="dashboard-topbar-actions">
          <span className="chip">
            <span className="status-dot" />
            <span>API connected</span>
          </span>
          <Link href="/" className="ghost-button">
            Home
          </Link>
          <Link href="/login" className="ghost-button ghost-button-strong">
            Switch account
          </Link>
        </div>
      </header>

      <main className="dashboard-workspace">{children}</main>
    </div>
  );
}
