"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ActivityList } from "@/components/activity-list";
import { ErrorState } from "@/components/error-state";
import { DashboardSkeleton } from "@/components/loading-state";
import { MetricCard } from "@/components/metric-card";
import { TopProductsTable } from "@/components/top-products-table";
import { TrendChart } from "@/components/trend-chart";
import { clearAccessToken, readAccessToken, readSession } from "@/lib/auth";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { getOverview, getRecentActivity, getTopProducts, getTrend, ApiError } from "@/lib/api";
import type { OverviewResponse, RecentActivityResponse, TopProductsResponse, TrendResponse } from "@/lib/contracts";

type DashboardDataState = {
  overview: OverviewResponse | null;
  topProducts: TopProductsResponse | null;
  recentActivity: RecentActivityResponse | null;
  trend: TrendResponse | null;
  loading: boolean;
  error: string | null;
  lastLoadedAt: string | null;
};

const initialState: DashboardDataState = {
  overview: null,
  topProducts: null,
  recentActivity: null,
  trend: null,
  loading: true,
  error: null,
  lastLoadedAt: null
};

const ranges: Array<TopProductsResponse["range"]> = ["today", "week", "month"];

function eventLabelFromType(eventType: string) {
  return eventType.replace(/_/g, " ");
}

export function DashboardClient() {
  const [state, setState] = useState(initialState);
  const [range, setRange] = useState<TopProductsResponse["range"]>("month");
  const token = readAccessToken();
  const session = readSession();

  useEffect(() => {
    let active = true;

    async function loadOverviewAndTopProducts() {
      if (!token) {
        setState({
          overview: null,
          topProducts: null,
          recentActivity: null,
          trend: null,
          loading: false,
          error: "No session found. Sign in first to load store analytics.",
          lastLoadedAt: null
        });
        return;
      }

      setState((current) => ({
        ...current,
        loading: current.overview === null,
        error: null
      }));

      try {
        const [overview, topProducts, trend] = await Promise.all([
          getOverview(token),
          getTopProducts(token, range),
          getTrend(token, 14)
        ]);

        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          overview,
          topProducts,
          trend,
          loading: false,
          error: null,
          lastLoadedAt: new Date().toISOString()
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof ApiError ? error.message : "We could not load the dashboard data."
        }));
      }
    }

    void loadOverviewAndTopProducts();

    if (!token) {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(() => {
      void loadOverviewAndTopProducts();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token, range]);

  useEffect(() => {
    let active = true;

    async function loadRecentActivity() {
      if (!token) {
        return;
      }

      try {
        const recentActivity = await getRecentActivity(token);

        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          recentActivity,
          lastLoadedAt: new Date().toISOString()
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          error: error instanceof ApiError ? error.message : "We could not refresh recent activity."
        }));
      }
    }

    void loadRecentActivity();

    if (!token) {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(() => {
      void loadRecentActivity();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token]);

  if (state.loading && !state.overview) {
    return (
      <section className="card" style={{ padding: 24 }}>
        <DashboardSkeleton />
      </section>
    );
  }

  if (state.error && !state.overview) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message={state.error}
        actionLabel="Go to login"
        actionHref="/login"
        onRetry={() => {
          clearAccessToken();
          window.location.reload();
        }}
      />
    );
  }

  if (!state.overview || !state.topProducts || !state.recentActivity || !state.trend) {
    return null;
  }

  const { overview } = state;
  const currency = overview.revenue.currency;
  const hasLiveError = Boolean(state.error);
  const lastLoadedText = state.lastLoadedAt ? formatRelativeTime(state.lastLoadedAt) : "Waiting for first refresh";
  const totalEvents = Object.values(overview.eventCounts).reduce((sum, value) => sum + value, 0) || 1;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className="card subtle-grid" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span className="section-label">Live status</span>
            <strong style={{ fontSize: "1.05rem" }}>
              {hasLiveError ? "Using the last successful data snapshot" : "Connected and refreshing automatically"}
            </strong>
            {session ? (
              <span style={{ color: "var(--muted)" }}>
                {session.store.name} • {session.user.email}
              </span>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="pill">
              <strong>Last fetch</strong>
              <span>{lastLoadedText}</span>
            </span>
            <span className="pill">
              <strong>Recent activity</strong>
              <span>5s refresh</span>
            </span>
            <Link href="/login" className="pill" style={{ color: "var(--text)" }}>
              Switch account
            </Link>
          </div>
        </div>
        <p style={{ margin: "10px 0 0", color: "var(--muted)" }}>
          {hasLiveError
            ? state.error
            : "Overview and top products refresh every 15 seconds. Recent activity refreshes every 5 seconds."}
        </p>
      </section>

      <section className="kpi-grid">
        <MetricCard label="Revenue today" value={formatCurrency(overview.revenue.todayCents, currency)} delta="Live" tone="good" />
        <MetricCard label="Revenue this week" value={formatCurrency(overview.revenue.weekCents, currency)} delta="Rolling" tone="good" />
        <MetricCard label="Revenue this month" value={formatCurrency(overview.revenue.monthCents, currency)} delta="Rolling" tone="good" />
        <MetricCard label="Conversion rate" value={`${(overview.conversionRate * 100).toFixed(2)}%`} delta="Page views to purchases" tone="neutral" />
      </section>

      <section className="two-col">
        <div className="card subtle-grid" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Event breakdown</h2>
            <span style={{ color: "var(--muted)" }}>{overview.lastUpdatedAt ? "Dashboard aggregate snapshot" : null}</span>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {Object.entries(overview.eventCounts).map(([eventType, count]) => {
              const percent = Math.max(8, Math.round((count / totalEvents) * 100));

              return (
                <div key={eventType}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ textTransform: "capitalize" }}>{eventLabelFromType(eventType)}</span>
                    <strong>
                      {count} <span style={{ color: "var(--muted)", fontWeight: 500 }}>({percent}%)</span>
                    </strong>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "var(--surface-2)" }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(90deg, var(--accent-2), #5c93a8)"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Recent activity</h2>
            <span style={{ color: "var(--muted)" }}>{state.recentActivity.items.length} events</span>
          </div>
          <ActivityList
            items={state.recentActivity.items.map((item) => ({
              id: item.eventId,
              label: eventLabelFromType(item.eventType),
              detail:
                item.productId === null
                  ? "Event recorded without a product reference."
                  : `${item.productId}${item.amountCents !== null ? ` • ${formatCurrency(item.amountCents, item.currency ?? currency)}` : ""}`,
              timestamp: new Date(item.occurredAt).toLocaleTimeString()
            }))}
          />
        </div>
      </section>

      <section className="two-col" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <section className="card subtle-grid" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Revenue trend</h2>
            <span style={{ color: "var(--muted)" }}>Last 14 days</span>
          </div>
          <TrendChart currency={currency} items={state.trend.items} />
        </section>

        <section className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Top products</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ranges.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === range ? "segmented-button segmented-button-active" : "segmented-button"}
                  onClick={() => setRange(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <TopProductsTable
            items={state.topProducts.items.map((item) => ({
              id: item.productId,
              name: item.productId,
              revenue: formatCurrency(item.revenueCents, state.topProducts?.currency ?? currency),
              orders: item.purchaseCount
            }))}
          />
        </section>
      </section>

      <section className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>What this store is doing well</h2>
          <span style={{ color: "var(--muted)" }}>Quick read</span>
        </div>
        <div className="insight-grid">
          <div className="insight-card">
            <span className="section-label">Strongest signal</span>
            <strong>{state.topProducts.items[0]?.productId ?? "No leading product yet"}</strong>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              {state.topProducts.items[0]
                ? `${formatCurrency(state.topProducts.items[0].revenueCents, currency)} in ${range} revenue`
                : "Ingest a few purchase events to see the strongest product surface."}
            </p>
          </div>
          <div className="insight-card">
            <span className="section-label">Funnel health</span>
            <strong>{(overview.conversionRate * 100).toFixed(2)}% conversion</strong>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              {overview.eventCounts.checkout_started} checkout starts from {overview.eventCounts.page_view} page views.
            </p>
          </div>
          <div className="insight-card">
            <span className="section-label">Velocity today</span>
            <strong>{formatCurrency(overview.revenue.todayCents, currency)}</strong>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              {state.recentActivity.items[0]
                ? `Latest event: ${eventLabelFromType(state.recentActivity.items[0].eventType)}`
                : "No recent activity yet."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
