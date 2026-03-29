type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
};

type ActivityListProps = {
  items: ActivityItem[];
};

export function ActivityList({ items }: ActivityListProps) {
  if (items.length === 0) {
    return <div className="empty-state">No recent activity yet. New events will appear here as soon as they are ingested.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            padding: 14,
            borderRadius: 18,
            border: "1px solid var(--line)",
            background: "rgba(255,255,255,0.6)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <strong style={{ textTransform: "capitalize" }}>{item.label.replace(/_/g, " ")}</strong>
            <span style={{ color: "var(--muted)" }}>{item.timestamp}</span>
          </div>
          <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{item.detail}</p>
        </div>
      ))}
    </div>
  );
}
