# Store Analytics Dashboard

A real-time analytics dashboard for store owners built with Bun, Next.js, NestJS, PostgreSQL, and Redis-compatible caching.

## Setup Instructions

### Prerequisites
- Bun
- Docker + Docker Compose, or native PostgreSQL + Valkey/Redis

### Standard local run
```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
bun install
bun run db:up
bun run db:migrate
bun run db:seed
bun run dev
```

Backend:
- `http://localhost:4000`

Frontend:
- `http://localhost:3000`
- If port `3000` is already in use, Next.js will automatically move to the next available port.

### Demo credentials
- Email: `owner1@example.com`
- Password: `password123`

### Arch Linux fast paths

#### Docker path
```bash
sudo pacman -Syu docker docker-compose bun
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
newgrp docker

cd /home/kavin/github/assignment
cp .env.example backend/.env
cp .env.example frontend/.env.local
bun install
bun run db:up
bun run db:migrate
bun run db:seed
bun run dev
```

The root scripts try `docker compose` first and automatically fall back to `docker-compose`.

#### Native services path
Arch currently ships Redis-compatible `valkey`.

```bash
sudo pacman -Syu postgresql valkey bun
sudo -iu postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
sudo systemctl enable --now valkey

cd /home/kavin/github/assignment
cp .env.example backend/.env
cp .env.example frontend/.env.local
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

## Architecture Decisions

### Data Aggregation Strategy
- Decision: store raw events in an append-only `events` table and maintain incremental daily rollups in `store_daily_metrics` and `product_daily_revenue`.
- Why: the dashboard repeatedly asks the same fixed questions. Reading overview and top-products from rollups keeps query latency predictable and avoids scanning raw event history on every page load.
- Trade-offs: this design is intentionally optimized for a fixed dashboard, not arbitrary ad hoc analytics queries.

### Real-time vs. Batch Processing
- Decision: near-real-time writes with synchronous raw event inserts, transactional rollup upserts, and short-lived Redis caching for repeated reads.
- Why: at the assignment scale, PostgreSQL can comfortably handle this workload without introducing a queue or separate streaming system. This keeps the implementation simple while still feeling real-time.
- Trade-offs: this is simpler than a buffered micro-batch pipeline, but it does a little more work on the write path. Aggregate reads are intentionally allowed to be a few seconds stale so short cache TTLs can stay effective without per-event invalidation. If ingestion volume increased significantly, a Redis-backed queue/worker would be the next evolution.

### Frontend Data Fetching
- Decision: login stores a JWT locally, then the dashboard uses zero-dependency manual HTTP polling for fresh data.
- Why: it keeps the UI simple, resilient, and easy to explain without adding a client-side data library for a small dashboard. The dashboard uses different freshness cadences for different surfaces:
  - overview and top products refresh every 15 seconds
  - recent activity refreshes every 5 seconds
- Trade-offs: polling is less “live” than websockets or SSE, but much simpler to maintain and completely sufficient for this product shape.

### Performance Optimizations
- Composite indexes on:
  - `events(store_id, occurred_at DESC)`
  - `events(store_id, event_type, occurred_at DESC)`
- Unique `event_id` for idempotency
- Explicit PostgreSQL pool limits and timeouts to avoid exhausting managed database connections
- Rate limiting on `POST /api/v1/events` to reduce ingestion abuse
- Pre-aggregated daily rollup tables for overview and top-products
- PostgreSQL-native timezone bucketing in the rollup upserts using `AT TIME ZONE ... ::date`
- Redis cache for overview, top-products, and trend with short TTLs
- Redis HyperLogLog-backed live visitor counting for a lightweight real-time signal
- Recent activity stays a bounded indexed query with `LIMIT 20`
- Backend guards derive tenant scope from the authenticated user context instead of trusting a `store_id` query parameter

## Metric Assumptions
- Revenue is stored as integer cents, never floating point.
- MVP assumes one reporting currency per store.
- Time windows use the store’s configured timezone.
- Conversion rate follows the prompt literally: `purchase_events / page_view_events`.
- Overview/top-products are aggregate reads; recent activity is a raw event read.

## API Surface
- `POST /api/v1/auth/login`
- `POST /api/v1/events`
- `GET /api/v1/analytics/overview`
- `GET /api/v1/analytics/top-products?range=today|week|month`
- `GET /api/v1/analytics/recent-activity`
- `GET /api/v1/analytics/trend?days=7|14|30`
- `GET /api/v1/analytics/live-visitors`

See also:
- [docs/architecture.md](docs/architecture.md)
- [docs/api-spec.md](docs/api-spec.md)
- [docs/roadmap.md](docs/roadmap.md)

## What Was Verified
- Backend build passes
- Frontend lint, type checks, and production build pass
- Backend test suite passes
- Nest app boots and exposes the required routes
- Live API loop was exercised locally:
  - login succeeds with seeded credentials
  - protected analytics endpoints reject unauthenticated requests
  - ingesting a purchase updates:
    - revenue totals
    - purchase counts
    - conversion rate
    - recent activity
- Top-products ranges were verified for `today`, `week`, and `month`
- Trend responses were verified for a 14-day window
- Live visitor responses were verified through the authenticated analytics API

## Performance Notes
The local seeded dataset currently contains:
- `2,287` raw events
- `2` stores
- `56` daily rollup rows
- `224` product revenue rollup rows

Measured locally against the running backend on warm requests:
- `GET /api/v1/analytics/overview`: ~`1.66ms` average
- `GET /api/v1/analytics/top-products?range=month`: ~`1.90ms` average
- `GET /api/v1/analytics/recent-activity`: ~`2.52ms` average
- `GET /api/v1/analytics/trend?days=14`: ~`1.71ms` average

Method:
- authenticate once with the seeded demo user
- hit each analytics endpoint 6 times locally with `curl`
- treat the first request as cold and report the average of the next 5 warm requests

## Known Limitations
- Conversion rate is event-based, not visitor- or session-based.
- Mixed-currency reporting is intentionally out of scope for MVP.
- Rollups are daily, so the design is optimized for this dashboard rather than arbitrary drilldowns.
- Aggregates are updated synchronously on ingest. Under a flash sale for a single store, hot-row contention on the same daily rollup row would become a scaling limit.
- Authentication is deliberately minimal for a take-home and assumes one primary store context per demo user.
- The current ingest rate limiter is in-memory per app instance. In a multi-instance deployment, it should move to a shared store like Redis.
- The current `event_id` uniqueness model assumes globally unique event IDs across stores. If upstream producers only guarantee store-local uniqueness, the constraint should become `(store_id, event_id)`.
- Dashboard freshness messaging currently reflects the last successful fetch time, not a persisted database watermark.
- There is no separate backfill/correction job yet for late-arriving events.

## What I’d Improve With More Time
- Add SSE for recent activity instead of polling
- Add custom date-range filtering with validation
- Add a buffered ingestion worker using Redis lists or streams
- Move rate limiting to a distributed Redis-backed implementation
- Extend automated coverage beyond the current auth/validation/tenant/duplicate-ingest checks
- Expand the benchmark section with larger seeded datasets and `EXPLAIN ANALYZE`
- Extend the metrics model toward visitor/session-based conversion

## Repository Structure
```text
repo/
├── backend/
├── frontend/
├── packages/shared/
├── docs/
├── README.md
└── .env.example
```

## Time Spent
Approximately 3 hours.
