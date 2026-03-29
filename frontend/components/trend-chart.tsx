import { formatCurrency } from "@/lib/format";

type TrendPoint = {
  date: string;
  revenueCents: number;
  purchases: number;
  conversionRate: number;
};

type TrendChartProps = {
  currency: string;
  items: TrendPoint[];
};

function formatShortDate(input: string) {
  return new Date(`${input}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export function TrendChart({ currency, items }: TrendChartProps) {
  if (items.length === 0) {
    return <div className="empty-state">No trend data yet for this store.</div>;
  }

  const maxRevenue = Math.max(...items.map((item) => item.revenueCents), 1);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="trend-grid">
        {items.map((item) => (
          <div key={item.date} className="trend-column">
            <div className="trend-bar-track">
              <div
                className="trend-bar-fill"
                style={{
                  height: `${Math.max(8, Math.round((item.revenueCents / maxRevenue) * 100))}%`
                }}
                title={`${formatShortDate(item.date)}: ${formatCurrency(item.revenueCents, currency)}`}
              />
            </div>
            <span className="trend-label">{formatShortDate(item.date)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.slice(-3).reverse().map((item) => (
          <div key={item.date} className="trend-summary-row">
            <div>
              <strong>{formatShortDate(item.date)}</strong>
              <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                {item.purchases} purchases • {(item.conversionRate * 100).toFixed(1)}% conversion
              </p>
            </div>
            <strong>{formatCurrency(item.revenueCents, currency)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
