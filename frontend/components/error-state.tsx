import Link from "next/link";

type ErrorStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, actionLabel, actionHref, onRetry }: ErrorStateProps) {
  return (
    <div className="card subtle-grid" style={{ padding: 24, borderColor: "rgba(184, 92, 56, 0.35)" }} role="alert">
      <p style={{ margin: 0, color: "#b85c38", fontWeight: 700 }}>{title}</p>
      <p style={{ margin: "10px 0 0", color: "var(--muted)" }}>{message}</p>
      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        {onRetry ? (
          <button
            onClick={onRetry}
            type="button"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: 0,
              background: "linear-gradient(90deg, var(--accent), #dd8659)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        ) : null}
        {actionLabel && actionHref ? (
          <Link href={actionHref} className="pill" style={{ color: "var(--text)" }}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
