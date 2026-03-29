type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  tone?: "neutral" | "good" | "warn";
};

export function MetricCard({ label, value, delta, tone = "neutral" }: MetricCardProps) {
  const accent =
    tone === "good" ? "var(--success)" : tone === "warn" ? "#b86b2a" : "var(--accent)";

  return (
    <article className="card" style={{ padding: 20, minHeight: 128 }}>
      <p style={{ margin: 0, color: "var(--muted)" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <strong style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>{value}</strong>
        <span style={{ color: accent, fontWeight: 600 }}>{delta}</span>
      </div>
    </article>
  );
}
