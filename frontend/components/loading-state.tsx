export function PanelSkeleton({ title }: { title: string }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <p style={{ margin: 0, color: "var(--muted)" }}>{title}</p>
      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <div className="skeleton" style={{ height: 18, width: "60%" }} />
        <div className="skeleton" style={{ height: 18, width: "90%" }} />
        <div className="skeleton" style={{ height: 18, width: "75%" }} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 14, width: 180 }} />
        <div className="skeleton" style={{ height: 28, width: "52%", marginTop: 14 }} />
        <div className="skeleton" style={{ height: 16, width: "68%", marginTop: 12 }} />
      </div>
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card" style={{ padding: 20 }}>
            <div className="skeleton" style={{ height: 14, width: "48%" }} />
            <div className="skeleton" style={{ height: 34, width: "72%", marginTop: 14 }} />
            <div className="skeleton" style={{ height: 12, width: "36%", marginTop: 14 }} />
          </div>
        ))}
      </div>
      <PanelSkeleton title="Activity and trend panels" />
      <div className="two-col">
        <PanelSkeleton title="Revenue overview" />
        <PanelSkeleton title="Recent activity" />
      </div>
      <PanelSkeleton title="Top products" />
    </div>
  );
}
