export function PanelSkeleton({ title }: { title: string }) {
  return (
    <div className="dashboard-panel">
      <p className="dashboard-panel-kicker">{title}</p>
      <div className="dashboard-skeleton-lines">
        <div className="skeleton skeleton-line skeleton-line-long" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line skeleton-line-short" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard-stack">
      <section className="dashboard-page-header">
        <div className="dashboard-skeleton-lines">
          <div className="skeleton skeleton-tag" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-copy" />
        </div>
      </section>

      <section className="dashboard-hero-grid">
        <div className="dashboard-panel dashboard-panel-hero">
          <div className="dashboard-skeleton-lines">
            <div className="skeleton skeleton-tag" />
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-copy" />
            <div className="skeleton skeleton-chart" />
          </div>
        </div>

        <div className="dashboard-side-stack">
          <PanelSkeleton title="Connection" />
          <PanelSkeleton title="Event mix" />
        </div>
      </section>

      <section className="dashboard-kpi-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="metric-card">
            <div className="skeleton skeleton-line skeleton-line-short" />
            <div className="skeleton skeleton-metric" />
            <div className="skeleton skeleton-line" />
          </div>
        ))}
      </section>

      <section className="dashboard-two-col">
        <PanelSkeleton title="Top products" />
        <PanelSkeleton title="Recent activity" />
      </section>
    </div>
  );
}
