"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ActivityList } from "@/components/activity-list";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { DashboardSkeleton } from "@/components/loading-state";
import { MetricCard } from "@/components/metric-card";
import { TopProductsTable } from "@/components/top-products-table";
import { TrendChart } from "@/components/trend-chart";
import { clearAccessToken, readAccessToken, readSession } from "@/lib/auth";
import { formatClockTime, formatCurrency, formatNumber, formatPercent, formatRelativeTime } from "@/lib/format";
import { getLiveVisitors, getOverview, getRecentActivity, getTopProducts, getTrend, ApiError } from "@/lib/api";
import type {
  LiveVisitorsResponse,
  OverviewResponse,
  RecentActivityResponse,
  TopProductsResponse,
  TrendResponse
} from "@/lib/contracts";

type DashboardDataState = {
  overview: OverviewResponse | null;
  topProducts: TopProductsResponse | null;
  recentActivity: RecentActivityResponse | null;
  trend: TrendResponse | null;
  liveVisitors: LiveVisitorsResponse | null;
  loading: boolean;
  aggregateError: string | null;
  feedError: string | null;
  lastAggregateLoadedAt: string | null;
  lastFeedLoadedAt: string | null;
};

const initialState: DashboardDataState = {
  overview: null,
  topProducts: null,
  recentActivity: null,
  trend: null,
  liveVisitors: null,
  loading: true,
  aggregateError: null,
  feedError: null,
  lastAggregateLoadedAt: null,
  lastFeedLoadedAt: null
};

const ranges: Array<TopProductsResponse["range"]> = ["today", "week", "month"];
const trendWindows = [7, 14, 30] as const;
const OVERVIEW_POLL_INTERVAL_MS = 15000;
const FEED_POLL_INTERVAL_MS = 5000;

function eventLabelFromType(eventType: string) {
  return eventType.replace(/_/g, " ");
}

function getSecondsUntilNextRefresh(lastLoadedAt: string | null, intervalMs: number, nowMs: number) {
  if (!lastLoadedAt) {
    return Math.round(intervalMs / 1000);
  }

  const elapsedMs = Math.max(0, nowMs - new Date(lastLoadedAt).getTime());
  const remainingMs = Math.max(0, intervalMs - elapsedMs);
  return Math.ceil(remainingMs / 1000);
}

export function DashboardClient() {
  const [state, setState] = useState(initialState);
  const [range, setRange] = useState<TopProductsResponse["range"]>("month");
  const [trendDays, setTrendDays] = useState<(typeof trendWindows)[number]>(14);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<ReturnType<typeof readSession>>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setToken(readAccessToken());
    setSession(readSession());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOverviewAndTopProducts() {
      if (!token) {
        setState({
          overview: null,
          topProducts: null,
          recentActivity: null,
          trend: null,
          liveVisitors: null,
          loading: false,
          aggregateError: "No session found. Sign in first to load store analytics.",
          feedError: null,
          lastAggregateLoadedAt: null,
          lastFeedLoadedAt: null
        });
        return;
      }

      setState((current) => ({
        ...current,
        loading: current.overview === null,
        aggregateError: null
      }));

      try {
        const [overview, topProducts, trend] = await Promise.all([
          getOverview(token),
          getTopProducts(token, range),
          getTrend(token, trendDays)
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
          aggregateError: null,
          lastAggregateLoadedAt: new Date().toISOString()
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          loading: false,
          aggregateError: error instanceof ApiError ? error.message : "We could not load the dashboard data."
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
    }, OVERVIEW_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token, range, trendDays]);

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
          feedError: null,
          lastFeedLoadedAt: new Date().toISOString()
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          feedError: error instanceof ApiError ? error.message : "We could not refresh recent activity."
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
    }, FEED_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadLiveVisitors() {
      if (!token) {
        return;
      }

      try {
        const liveVisitors = await getLiveVisitors(token);

        if (!active) {
          return;
        }

        setState((current) => ({
          ...current,
          liveVisitors
        }));
      } catch {
        if (!active) {
          return;
        }
      }
    }

    void loadLiveVisitors();

    if (!token) {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(() => {
      void loadLiveVisitors();
    }, FEED_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [token]);

  if (!isHydrated) {
    return (
      <section className="card" style={{ padding: 24 }}>
        <DashboardSkeleton />
      </section>
    );
  }

  if (state.loading && !state.overview) {
    return (
      <section className="card" style={{ padding: 24 }}>
        <DashboardSkeleton />
      </section>
    );
  }

  if (state.aggregateError && !state.overview) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message={state.aggregateError}
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
  const hasAggregateError = Boolean(state.aggregateError);
  const hasFeedError = Boolean(state.feedError);
  const hasLiveError = hasAggregateError || hasFeedError;
  const lastSyncAt = [state.lastAggregateLoadedAt, state.lastFeedLoadedAt]
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
  const lastLoadedText = lastSyncAt ? formatRelativeTime(lastSyncAt) : "Waiting for first refresh";
  const overviewCountdown = getSecondsUntilNextRefresh(
    state.lastAggregateLoadedAt,
    OVERVIEW_POLL_INTERVAL_MS,
    nowMs
  );
  const feedCountdown = getSecondsUntilNextRefresh(
    state.lastFeedLoadedAt,
    FEED_POLL_INTERVAL_MS,
    nowMs
  );
  const totalEventCount = Object.values(overview.eventCounts).reduce((sum, value) => sum + value, 0);
  const totalEvents = totalEventCount || 1;
  const currentDayOfMonth = new Date().getDate();
  const purchases = overview.eventCounts.purchase;
  const pageViews = overview.eventCounts.page_view;
  const checkoutStarts = overview.eventCounts.checkout_started;
  const weekDailyAverage = Math.round(overview.revenue.weekCents / 7);
  const monthDailyAverage = Math.round(overview.revenue.monthCents / Math.max(currentDayOfMonth, 1));
  const rankedRevenueTotal = state.topProducts.items.reduce((sum, item) => sum + item.revenueCents, 0);
  const topProductsCurrency = state.topProducts.currency;
  const latestTrendPoint = state.trend.items[state.trend.items.length - 1];
  const trendLabel = `Last ${trendDays} days`;

  if (totalEventCount === 0 && state.topProducts.items.length === 0 && state.recentActivity.items.length === 0) {
    return (
      <section className="dashboard-zero-state">
        <div className="dashboard-zero-state-copy">
          <span className="section-label">Waiting for first event</span>
          <h1>No analytics yet, but the pipeline is ready.</h1>
          <p>
            As soon as the store sends a page view or purchase, the dashboard will fill with revenue,
            conversion, product rankings, and recent activity.
          </p>

          <div className="dashboard-zero-state-code">
            <span>Example event</span>
            <pre>{`POST /api/v1/events
{
  "event_id": "evt_123",
  "event_type": "purchase",
  "timestamp": "2026-03-24T10:30:00Z",
  "data": {
    "product_id": "prod_789",
    "amount": 49.99,
    "currency": "USD"
  }
}`}</pre>
          </div>
        </div>

        <div className="dashboard-zero-state-aside">
          <div className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-panel-kicker">Live status</p>
                <h2 className="dashboard-panel-title">Ready for traffic</h2>
              </div>
              <span className="dashboard-panel-meta">Polling every 5s / 15s</span>
            </div>
            <EmptyState
              compact
              title="No events have landed yet"
              message="Metrics and charts will appear here as soon as the first event is ingested."
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="dashboard-stack">
      <section className="dashboard-page-header">
        <div className="dashboard-page-copy">
          <span className="section-label section-label-live">
            <span className="status-dot status-dot-live" aria-hidden="true" />
            <span>Live status</span>
          </span>
          <h1>Revenue, conversion, and activity at a glance.</h1>
          <p>
            The dashboard reads rollups for fast merchant metrics and keeps the event feed fresher with
            shorter polling.
          </p>
        </div>

        <div className="dashboard-badge-row">
          <span className="chip">
            <span className="status-dot" />
            <span>
              {hasAggregateError
                ? "Snapshot mode"
                : hasFeedError
                  ? "Feed delayed"
                  : "Auto-refreshing"}
            </span>
          </span>
          <span className="chip">
            <span className="status-dot" />
            <span>Live visitors</span>
            <strong>{state.liveVisitors ? formatNumber(state.liveVisitors.count) : "—"}</strong>
          </span>
          <span className="chip">
            <strong>Last sync</strong>
            <span>{lastLoadedText}</span>
          </span>
          <span className="chip">
            <strong>Cadence</strong>
            <span>{overviewCountdown}s overview / {feedCountdown}s feed</span>
          </span>
          <span className="chip">
            <strong>Trend</strong>
            <span>{trendLabel}</span>
          </span>
          <Link href="/login" className="ghost-button">
            Switch account
          </Link>
        </div>
      </section>

      {hasLiveError ? (
        <section className="dashboard-inline-alert">
          <strong>{hasAggregateError ? "Using the last successful snapshot." : "Using the last successful feed."}</strong>
          <span>{state.aggregateError ?? state.feedError}</span>
        </section>
      ) : null}

      <section className="dashboard-hero-grid">
        <article className="dashboard-panel dashboard-panel-hero">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-kicker">Revenue pulse</p>
              <h2 className="dashboard-panel-title">{trendLabel}</h2>
            </div>
            <span className="dashboard-panel-meta">
              {latestTrendPoint ? `${latestTrendPoint.purchases} purchases in latest close` : "Live trend"}
            </span>
            <div className="range-switcher" role="tablist" aria-label="Trend window">
              {trendWindows.map((windowDays) => (
                <button
                  key={windowDays}
                  type="button"
                  className={
                    windowDays === trendDays
                      ? "range-switcher-button range-switcher-button-active"
                      : "range-switcher-button"
                  }
                  onClick={() => setTrendDays(windowDays)}
                >
                  {windowDays}
                  </button>
              ))}
            </div>
          </div>

          <div className="dashboard-hero-stats">
            <div>
              <p className="dashboard-panel-kicker">Month to date</p>
              <strong className="dashboard-hero-value">{formatCurrency(overview.revenue.monthCents, currency)}</strong>
              <p className="dashboard-hero-copy">
                Averaging {formatCurrency(monthDailyAverage, currency)} per day across {currentDayOfMonth} days.
              </p>
            </div>

            <div className="dashboard-hero-tags">
              <span className="dashboard-mini-stat">
                <span>Today</span>
                <strong>{formatCurrency(overview.revenue.todayCents, currency)}</strong>
              </span>
              <span className="dashboard-mini-stat">
                <span>Conversion</span>
                <strong>{formatPercent(overview.conversionRate)}</strong>
              </span>
            </div>
          </div>

          <TrendChart currency={currency} items={state.trend.items} />
        </article>

        <div className="dashboard-side-stack">
          <article className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-panel-kicker">Connection</p>
                <h2 className="dashboard-panel-title">Store status</h2>
              </div>
              <span className="dashboard-panel-meta">{overview.lastUpdatedAt ? "Healthy" : "Pending"}</span>
            </div>

            <div className="dashboard-summary-list">
              <div className="dashboard-summary-row">
                <span>Store</span>
                <strong>{session?.store.name ?? "Demo store"}</strong>
              </div>
              <div className="dashboard-summary-row">
                <span>Operator</span>
                <strong>{session?.user.email ?? "Signed out"}</strong>
              </div>
              <div className="dashboard-summary-row">
                <span>Last aggregate</span>
                <strong>{state.lastAggregateLoadedAt ? formatRelativeTime(state.lastAggregateLoadedAt) : "Waiting"}</strong>
              </div>
              <div className="dashboard-summary-row">
                <span>Events tracked</span>
                <strong>{formatNumber(totalEvents)}</strong>
              </div>
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-panel-kicker">Behavior mix</p>
                <h2 className="dashboard-panel-title">Event breakdown</h2>
              </div>
              <span className="dashboard-panel-meta">{formatNumber(totalEvents)} total</span>
            </div>

            <div className="dashboard-breakdown-list">
              {Object.entries(overview.eventCounts).map(([eventType, count]) => {
                const percent = Math.max(6, Math.round((count / totalEvents) * 100));

                return (
                  <div key={eventType} className="breakdown-row">
                    <div className="breakdown-row-copy">
                      <span>{eventLabelFromType(eventType)}</span>
                      <strong>
                        {formatNumber(count)} <em>{percent}%</em>
                      </strong>
                    </div>
                    <div className="breakdown-bar" aria-hidden="true">
                      <div className="breakdown-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-kpi-grid">
        <MetricCard
          label="Revenue today"
          value={formatCurrency(overview.revenue.todayCents, currency)}
          delta={overview.revenue.todayCents >= weekDailyAverage ? "Ahead of 7-day pace" : "Below 7-day pace"}
          hint={`7-day daily average: ${formatCurrency(weekDailyAverage, currency)}`}
          tone={overview.revenue.todayCents >= weekDailyAverage ? "good" : "neutral"}
        />
        <MetricCard
          label="Revenue this week"
          value={formatCurrency(overview.revenue.weekCents, currency)}
          delta={`${formatNumber(purchases)} purchases`}
          hint={`Average order value: ${formatCurrency(Math.round(overview.revenue.weekCents / Math.max(purchases, 1)), currency)}`}
          tone="accent"
        />
        <MetricCard
          label="Revenue this month"
          value={formatCurrency(overview.revenue.monthCents, currency)}
          delta={`${formatCurrency(monthDailyAverage, currency)} / day`}
          hint={`Month-to-date run rate across ${currentDayOfMonth} active days`}
          tone="good"
        />
        <MetricCard
          label="Conversion rate"
          value={formatPercent(overview.conversionRate)}
          delta={`${formatNumber(checkoutStarts)} checkout starts`}
          hint={`${formatNumber(pageViews)} page views observed`}
          tone="neutral"
        />
      </section>

      <section className="dashboard-two-col">
        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-kicker">Merchandising</p>
              <h2 className="dashboard-panel-title">Top products</h2>
            </div>
            <div className="range-switcher" role="tablist" aria-label="Top product range">
              {ranges.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value === range ? "range-switcher-button range-switcher-button-active" : "range-switcher-button"}
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
              revenue: formatCurrency(item.revenueCents, topProductsCurrency ?? currency),
              orders: item.purchaseCount,
              share:
                rankedRevenueTotal > 0
                  ? formatPercent(item.revenueCents / rankedRevenueTotal, 0)
                  : "0%"
            }))}
          />
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-kicker">Event stream</p>
              <h2 className="dashboard-panel-title">Recent activity</h2>
            </div>
            <span className="dashboard-panel-meta">{state.recentActivity.items.length} latest events</span>
          </div>

          <ActivityList
            items={state.recentActivity.items.map((item) => ({
              id: item.eventId,
              label: eventLabelFromType(item.eventType),
              detail:
                item.productId === null
                  ? "Event recorded without a product reference."
                  : `${item.productId}${item.amountCents !== null ? ` • ${formatCurrency(item.amountCents, item.currency ?? currency)}` : ""}`,
              timestamp: formatClockTime(item.occurredAt),
              tone: item.eventType === "purchase" ? "success" : item.eventType === "checkout_started" ? "accent" : "neutral"
            }))}
          />
        </article>
      </section>
    </div>
  );
}
