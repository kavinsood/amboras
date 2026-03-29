CREATE TYPE event_type AS ENUM (
  'page_view',
  'add_to_cart',
  'remove_from_cart',
  'checkout_started',
  'purchase'
);

CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE store_memberships (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  PRIMARY KEY (user_id, store_id)
);

CREATE TABLE events (
  event_id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_id TEXT,
  amount_cents INTEGER,
  currency CHAR(3),
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE store_daily_metrics (
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  bucket_date DATE NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 0,
  add_to_cart INTEGER NOT NULL DEFAULT 0,
  remove_from_cart INTEGER NOT NULL DEFAULT 0,
  checkout_started INTEGER NOT NULL DEFAULT 0,
  purchases INTEGER NOT NULL DEFAULT 0,
  revenue_cents BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (store_id, bucket_date)
);

CREATE TABLE product_daily_revenue (
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  bucket_date DATE NOT NULL,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  revenue_cents BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (store_id, product_id, bucket_date)
);
