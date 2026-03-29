CREATE INDEX idx_events_store_occurred_at
  ON events (store_id, occurred_at DESC);

CREATE INDEX idx_events_store_type_occurred_at
  ON events (store_id, event_type, occurred_at DESC);
