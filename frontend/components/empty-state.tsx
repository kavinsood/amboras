type EmptyStateProps = {
  title: string;
  message: string;
  compact?: boolean;
};

export function EmptyState({ title, message, compact = false }: EmptyStateProps) {
  return (
    <div className={compact ? "empty-state empty-state-compact" : "empty-state"}>
      <div className="empty-state-icon" aria-hidden="true" />
      <div>
        <p className="empty-state-title">{title}</p>
        <p className="empty-state-copy">{message}</p>
      </div>
    </div>
  );
}
