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
    <div className="error-state" role="alert">
      <p className="error-state-title">{title}</p>
      <p className="error-state-copy">{message}</p>
      <div className="error-state-actions">
        {onRetry ? (
          <button onClick={onRetry} type="button" className="primary-button">
            Retry
          </button>
        ) : null}
        {actionLabel && actionHref ? (
          <Link href={actionHref} className="ghost-button ghost-button-strong">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
