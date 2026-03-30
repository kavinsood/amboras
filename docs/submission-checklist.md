# Submission Checklist

## Repo And Local Run
- [ ] `bun install` works from repo root
- [ ] `bun run db:up` starts PostgreSQL and Redis/Valkey
- [ ] `bun run db:migrate` completes successfully
- [ ] `bun run db:seed` completes successfully
- [ ] `bun run --cwd backend test` passes
- [ ] `bun run --cwd frontend lint` passes
- [ ] `rm -rf frontend/.next && bun run --cwd frontend build` passes
- [ ] `bun run dev` starts both apps locally

## Demo Readiness
- [ ] Login works with the seeded demo account
- [ ] Dashboard loads without console or network errors
- [ ] Overview shows revenue, event counts, and conversion rate
- [ ] Top products works for `today`, `week`, and `month`
- [ ] Recent activity shows the latest 20 events
- [ ] Trend chart switches cleanly between `7`, `14`, and `30` days
- [ ] Live visitors badge loads without breaking the dashboard
- [ ] Ingesting a purchase event updates the dashboard on refresh/poll

## Backend Review Points
- [ ] Rollups are served from `store_daily_metrics` and `product_daily_revenue`
- [ ] Recent activity is served from raw `events`
- [ ] `event_id` duplicate ingest returns `409`
- [ ] Store scope is derived from JWT context, not trusted from query/body
- [ ] Purchase validation rejects missing/invalid amount or wrong currency

## Docs
- [ ] `README.md` has setup instructions
- [ ] `README.md` has architecture decisions and trade-offs
- [ ] `README.md` has performance notes and measured timings
- [ ] `README.md` has known limitations
- [ ] `README.md` has `Time Spent: 1.5 hours`
- [ ] `docs/api-spec.md` reflects the current API surface
- [ ] `docs/architecture.md` and `docs/roadmap.md` are still aligned with the repo

## GitHub Submission
- [ ] Repo is pushed to a public GitHub repository
- [ ] No secrets or local `.env` files are committed
- [ ] Generated build artifacts are not tracked
- [ ] Final `git status` is clean before pushing

## Loom / Walkthrough
- [ ] 3-5 min demo of login and dashboard
- [ ] Show one live ingest request and the dashboard updating
- [ ] 5-8 min code walkthrough of rollups, tenant scoping, and caching
- [ ] Explain why Postgres + rollups was chosen over heavier infrastructure
- [ ] Call out known limitation: hot-row contention under a flash sale
- [ ] 2 min reflection on trade-offs and what you would improve next

## Email
- [ ] GitHub repo link included
- [ ] Loom/video link included
- [ ] Short note with assumptions or limitations included
