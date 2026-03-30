# Architecture Spec

## Goal
Build a fast, locally runnable analytics dashboard using Bun, Next.js, NestJS, PostgreSQL, and Redis.

## Design Decisions
- Use Docker Compose only for PostgreSQL and Redis during development.
- Run Next.js and NestJS on the host for faster iteration and simpler debugging.
- Use PostgreSQL as the source of truth.
- Use Redis for short-lived analytics caching.
- Use Redis HyperLogLog for approximate live-visitor counting.
- Use append-only raw events plus incremental rollup tables for dashboard reads.

## Data Flow
1. Authenticated store owner logs in.
2. Event ingestion accepts validated event payloads.
3. Backend persists the raw event to `events`.
4. Backend updates aggregate rows in `store_daily_metrics` and `product_daily_revenue`.
5. Page-view ingestion updates a lightweight live-visitor signal in Redis.
6. Aggregate endpoints use short-lived Redis cache entries for repeated reads, while recent activity hits the indexed raw events table directly.
7. Dashboard fetches overview, top products, trend data, live visitors, and recent activity from analytics endpoints.

## Scope Rules
- One reporting currency per store for MVP.
- Store-local timezone drives day/week/month windows.
- Conversion rate is `purchase_events / page_view_events`.
- Recent activity reads raw events directly.
- Overview and top-products read aggregate tables, not raw event scans.

## Deferred Work
- Redis-backed ingestion queue
- SSE/WebSockets
- Date range filtering
- Late-event correction pipeline
- Distributed rate limiting
- ClickHouse or OLAP migration
