import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { DbService } from '../db/db.service';
import { StoresRepository } from '../stores/stores.repository';

interface OverviewMetricsRow {
  today_cents: string;
  week_cents: string;
  month_cents: string;
  page_views_total: string;
  add_to_cart_total: string;
  remove_from_cart_total: string;
  checkout_started_total: string;
  purchases_total: string;
}

interface TopProductRow {
  product_id: string;
  revenue_cents: string;
  purchase_count: string;
}

interface RecentActivityRow {
  event_id: string;
  event_type: string;
  occurred_at: Date;
  product_id: string | null;
  amount_cents: number | null;
  currency: string | null;
}

interface TrendRow {
  bucket_date: string;
  revenue_cents: string;
  purchases: string;
  page_views: string;
}

@Injectable()
export class AnalyticsRepository {
  constructor(
    private readonly db: DbService,
    private readonly storesRepository: StoresRepository,
  ) {}

  async getOverview(storeId: string) {
    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const result = await this.db.query<OverviewMetricsRow>(
      `
        WITH bounds AS (
          SELECT
            (NOW() AT TIME ZONE $2)::date AS today,
            date_trunc('week', NOW() AT TIME ZONE $2)::date AS week_start,
            date_trunc('month', NOW() AT TIME ZONE $2)::date AS month_start
        )
        SELECT
          COALESCE(SUM(revenue_cents) FILTER (WHERE bucket_date = bounds.today), 0)::bigint AS today_cents,
          COALESCE(SUM(revenue_cents) FILTER (WHERE bucket_date >= bounds.week_start), 0)::bigint AS week_cents,
          COALESCE(SUM(revenue_cents) FILTER (WHERE bucket_date >= bounds.month_start), 0)::bigint AS month_cents,
          COALESCE(SUM(page_views), 0)::bigint AS page_views_total,
          COALESCE(SUM(add_to_cart), 0)::bigint AS add_to_cart_total,
          COALESCE(SUM(remove_from_cart), 0)::bigint AS remove_from_cart_total,
          COALESCE(SUM(checkout_started), 0)::bigint AS checkout_started_total,
          COALESCE(SUM(purchases), 0)::bigint AS purchases_total
        FROM store_daily_metrics
        CROSS JOIN bounds
        WHERE store_id = $1
      `,
      [storeId, store.timezone],
    );

    const metrics = result.rows[0];
    const pageViews = Number(metrics?.page_views_total ?? 0);
    const purchases = Number(metrics?.purchases_total ?? 0);

    return {
      revenue: {
        todayCents: Number(metrics?.today_cents ?? 0),
        weekCents: Number(metrics?.week_cents ?? 0),
        monthCents: Number(metrics?.month_cents ?? 0),
        currency: store.currency,
      },
      eventCounts: {
        page_view: pageViews,
        add_to_cart: Number(metrics?.add_to_cart_total ?? 0),
        remove_from_cart: Number(metrics?.remove_from_cart_total ?? 0),
        checkout_started: Number(metrics?.checkout_started_total ?? 0),
        purchase: purchases,
      },
      conversionRate: pageViews === 0 ? 0 : Number((purchases / pageViews).toFixed(4)),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async getTopProducts(storeId: string, query: AnalyticsQueryDto) {
    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const boundsResult = await this.db.query<{
      today: string;
      week_start: string;
      month_start: string;
    }>(
      `
        SELECT
          (NOW() AT TIME ZONE $2)::date::text AS today,
          date_trunc('week', NOW() AT TIME ZONE $2)::date::text AS week_start,
          date_trunc('month', NOW() AT TIME ZONE $2)::date::text AS month_start
        FROM stores
        WHERE id = $1
      `,
      [storeId, store.timezone],
    );

    const bounds = boundsResult.rows[0];
    const startDate =
      query.range === 'today'
        ? bounds.today
        : query.range === 'week'
          ? bounds.week_start
          : bounds.month_start;

    const result = await this.db.query<TopProductRow>(
      `
        SELECT
          product_id,
          SUM(revenue_cents)::bigint AS revenue_cents,
          SUM(purchase_count)::bigint AS purchase_count
        FROM product_daily_revenue
        WHERE store_id = $1
          AND bucket_date >= $2::date
        GROUP BY product_id
        ORDER BY revenue_cents DESC, purchase_count DESC
        LIMIT 10
      `,
      [storeId, startDate],
    );

    return {
      range: query.range,
      currency: store.currency,
      items: result.rows.map((row) => ({
        productId: row.product_id,
        revenueCents: Number(row.revenue_cents),
        purchaseCount: Number(row.purchase_count),
      })),
    };
  }

  async getRecentActivity(storeId: string) {
    const result = await this.db.query<RecentActivityRow>(
      `
        SELECT
          event_id,
          event_type,
          occurred_at,
          product_id,
          amount_cents,
          currency
        FROM events
        WHERE store_id = $1
        ORDER BY occurred_at DESC
        LIMIT 20
      `,
      [storeId],
    );

    return {
      items: result.rows.map((row) => ({
        eventId: row.event_id,
        eventType: row.event_type,
        occurredAt: row.occurred_at.toISOString(),
        productId: row.product_id,
        amountCents: row.amount_cents,
        currency: row.currency,
      })),
    };
  }

  async getTrend(storeId: string, days: number) {
    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const result = await this.db.query<TrendRow>(
      `
        WITH bounds AS (
          SELECT (NOW() AT TIME ZONE $2)::date AS today
        ),
        series AS (
          SELECT generate_series(
            (SELECT today FROM bounds) - ($3::int - 1),
            (SELECT today FROM bounds),
            interval '1 day'
          )::date AS bucket_date
        )
        SELECT
          series.bucket_date::text,
          COALESCE(store_daily_metrics.revenue_cents, 0)::bigint AS revenue_cents,
          COALESCE(store_daily_metrics.purchases, 0)::bigint AS purchases,
          COALESCE(store_daily_metrics.page_views, 0)::bigint AS page_views
        FROM series
        LEFT JOIN store_daily_metrics
          ON store_daily_metrics.store_id = $1
         AND store_daily_metrics.bucket_date = series.bucket_date
        ORDER BY series.bucket_date ASC
      `,
      [storeId, store.timezone, days],
    );

    return {
      currency: store.currency,
      items: result.rows.map((row) => {
        const purchases = Number(row.purchases);
        const pageViews = Number(row.page_views);

        return {
          date: row.bucket_date,
          revenueCents: Number(row.revenue_cents),
          purchases,
          pageViews,
          conversionRate:
            pageViews === 0 ? 0 : Number((purchases / pageViews).toFixed(4)),
        };
      }),
    };
  }
}
