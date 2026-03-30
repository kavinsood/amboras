import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from "recharts";
import { EmptyState } from "@/components/empty-state";
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

function TrendTooltip({
  active,
  payload,
  label,
  currency
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <strong>{formatCurrency(point.revenueCents, currency)}</strong>
      <div className="chart-tooltip-meta">
        <span>{point.purchases} purchases</span>
        <span>{(point.conversionRate * 100).toFixed(2)}% conversion</span>
      </div>
    </div>
  );
}

export function TrendChart({ currency, items }: TrendChartProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        compact
        title="No revenue trend yet"
        message="Daily rollups will render here as soon as the store has enough events to plot."
      />
    );
  }

  const strongestDay = [...items].sort((left, right) => right.revenueCents - left.revenueCents)[0] ?? items[0];
  const latestDay = items[items.length - 1];
  const averageConversionRate =
    items.reduce((sum, item) => sum + item.conversionRate, 0) / Math.max(items.length, 1);

  return (
    <div className="trend-chart-stack">
      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={items} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendRevenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-fill-strong)" stopOpacity={0.34} />
                <stop offset="55%" stopColor="var(--chart-fill)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--chart-fill-soft)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={28}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              tickFormatter={formatShortDate}
              tickLine={false}
            />
            <Tooltip
              content={<TrendTooltip currency={currency} />}
              cursor={{ stroke: "var(--chart-line-soft)", strokeDasharray: "4 4" }}
            />
            <Area
              dataKey="revenueCents"
              fill="url(#trendRevenueFill)"
              fillOpacity={1}
              stroke="var(--chart-line)"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              activeDot={{ fill: "var(--chart-line)", r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
              dataKey="revenueCents"
              dot={false}
              stroke="var(--chart-line)"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="trend-footnotes">
        <article className="trend-footnote-card">
          <span>Strongest day</span>
          <strong>{formatShortDate(strongestDay.date)}</strong>
          <p>{formatCurrency(strongestDay.revenueCents, currency)}</p>
        </article>
        <article className="trend-footnote-card">
          <span>Latest close</span>
          <strong>{formatShortDate(latestDay.date)}</strong>
          <p>{formatCurrency(latestDay.revenueCents, currency)}</p>
        </article>
        <article className="trend-footnote-card">
          <span>Average conversion</span>
          <strong>{(averageConversionRate * 100).toFixed(2)}%</strong>
          <p>Across the last {items.length} days</p>
        </article>
      </div>
    </div>
  );
}
