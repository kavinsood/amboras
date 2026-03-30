import { EmptyState } from "@/components/empty-state";

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
  tone: "accent" | "success" | "neutral";
};

type ActivityListProps = {
  items: ActivityItem[];
};

export function ActivityList({ items }: ActivityListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        compact
        title="No recent activity"
        message="New events will stream into this feed as soon as they are ingested."
      />
    );
  }

  return (
    <div className="activity-feed">
      {items.map((item) => (
        <article key={item.id} className="activity-row">
          <div className={`activity-marker activity-marker-${item.tone}`} aria-hidden="true" />
          <div className="activity-copy">
            <div className="activity-copy-head">
              <strong>{item.label}</strong>
              <span>{item.timestamp}</span>
            </div>
            <p>{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
