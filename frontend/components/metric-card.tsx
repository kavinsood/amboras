type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  hint: string;
  tone?: "neutral" | "good" | "accent";
};

export function MetricCard({ label, value, delta, hint, tone = "neutral" }: MetricCardProps) {
  const toneClass =
    tone === "good"
      ? "metric-card metric-card-good"
      : tone === "accent"
        ? "metric-card metric-card-accent"
        : "metric-card";

  return (
    <article className={toneClass}>
      <div className="metric-card-head">
        <p className="metric-card-label">{label}</p>
        <span className="metric-card-delta">{delta}</span>
      </div>
      <strong className="metric-card-value">{value}</strong>
      <p className="metric-card-hint">{hint}</p>
      <div className="metric-card-rule" aria-hidden="true">
        <span />
      </div>
    </article>
  );
}
