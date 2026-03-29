import bcrypt from 'bcryptjs';
import { Pool, PoolClient } from 'pg';

interface SeedEvent {
  eventId: string;
  storeId: string;
  eventType:
    | 'page_view'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'checkout_started'
    | 'purchase';
  occurredAt: string;
  productId: string | null;
  amountCents: number | null;
  currency: string | null;
  rawData: Record<string, unknown>;
}

const stores = [
  {
    id: 'store_1',
    name: 'Northwind Store',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
  },
  {
    id: 'store_2',
    name: 'Eastwind Store',
    timezone: 'America/New_York',
    currency: 'USD',
  },
] as const;

const products = [
  { id: 'prod_aurora', amountCents: 2900 },
  { id: 'prod_cinder', amountCents: 4900 },
  { id: 'prod_orbit', amountCents: 7900 },
  { id: 'prod_summit', amountCents: 12900 },
  { id: 'prod_harbor', amountCents: 19900 },
] as const;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const passwordHash = await bcrypt.hash('password123', 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      TRUNCATE TABLE
        product_daily_revenue,
        store_daily_metrics,
        events,
        store_memberships,
        users,
        stores
      RESTART IDENTITY CASCADE
    `);

    await client.query(
      `
      INSERT INTO stores (id, name, timezone, currency)
      VALUES
        ('store_1', 'Northwind Store', 'America/Los_Angeles', 'USD'),
        ('store_2', 'Eastwind Store', 'America/New_York', 'USD')
    `,
    );

    await client.query(
      `
      INSERT INTO users (id, email, password_hash)
      VALUES
        ('user_1', 'owner1@example.com', $1),
        ('user_2', 'owner2@example.com', $1)
    `,
      [passwordHash],
    );

    await client.query(
      `
      INSERT INTO store_memberships (user_id, store_id, role)
      VALUES
        ('user_1', 'store_1', 'owner'),
        ('user_2', 'store_2', 'owner')
    `,
    );

    const events = buildSeedEvents();
    if (events.length > 0) {
      await insertEvents(client, events);
    }

    await client.query(`
      INSERT INTO store_daily_metrics (
        store_id,
        bucket_date,
        page_views,
        add_to_cart,
        remove_from_cart,
        checkout_started,
        purchases,
        revenue_cents
      )
      SELECT
        events.store_id,
        (events.occurred_at AT TIME ZONE stores.timezone)::date AS bucket_date,
        COUNT(*) FILTER (WHERE events.event_type = 'page_view')::int AS page_views,
        COUNT(*) FILTER (WHERE events.event_type = 'add_to_cart')::int AS add_to_cart,
        COUNT(*) FILTER (WHERE events.event_type = 'remove_from_cart')::int AS remove_from_cart,
        COUNT(*) FILTER (WHERE events.event_type = 'checkout_started')::int AS checkout_started,
        COUNT(*) FILTER (WHERE events.event_type = 'purchase')::int AS purchases,
        COALESCE(SUM(events.amount_cents) FILTER (WHERE events.event_type = 'purchase'), 0)::bigint AS revenue_cents
      FROM events
      INNER JOIN stores ON stores.id = events.store_id
      GROUP BY events.store_id, (events.occurred_at AT TIME ZONE stores.timezone)::date
    `);

    await client.query(`
      INSERT INTO product_daily_revenue (
        store_id,
        product_id,
        bucket_date,
        purchase_count,
        revenue_cents
      )
      SELECT
        events.store_id,
        events.product_id,
        (events.occurred_at AT TIME ZONE stores.timezone)::date AS bucket_date,
        COUNT(*)::int AS purchase_count,
        COALESCE(SUM(events.amount_cents), 0)::bigint AS revenue_cents
      FROM events
      INNER JOIN stores ON stores.id = events.store_id
      WHERE events.event_type = 'purchase'
        AND events.product_id IS NOT NULL
      GROUP BY
        events.store_id,
        events.product_id,
        (events.occurred_at AT TIME ZONE stores.timezone)::date
    `);

    await client.query('COMMIT');
    console.log(`Seeded demo stores, users, and ${events.length} events`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();

function buildSeedEvents(): SeedEvent[] {
  const now = new Date();
  let sequence = 1;
  const events: SeedEvent[] = [];

  stores.forEach((store, storeIndex) => {
    for (let dayOffset = 0; dayOffset < 28; dayOffset += 1) {
      const dayDate = new Date(now);
      dayDate.setUTCDate(now.getUTCDate() - dayOffset);
      dayDate.setUTCHours(14 + storeIndex, 0, 0, 0);

      const pageViews = 18 + ((dayOffset + storeIndex) % 6) * 2;
      const addToCart = 6 + ((dayOffset + storeIndex) % 4);
      const removeFromCart = 1 + (dayOffset % 2);
      const checkoutStarted = 4 + ((dayOffset + storeIndex) % 3);
      const purchases = 3 + ((dayOffset + storeIndex) % 3);

      pushEvents(events, {
        count: pageViews,
        dayDate,
        eventType: 'page_view',
        storeId: store.id,
        sequenceStart: sequence,
      });
      sequence += pageViews;

      pushEvents(events, {
        count: addToCart,
        dayDate,
        eventType: 'add_to_cart',
        storeId: store.id,
        sequenceStart: sequence,
      });
      sequence += addToCart;

      pushEvents(events, {
        count: removeFromCart,
        dayDate,
        eventType: 'remove_from_cart',
        storeId: store.id,
        sequenceStart: sequence,
      });
      sequence += removeFromCart;

      pushEvents(events, {
        count: checkoutStarted,
        dayDate,
        eventType: 'checkout_started',
        storeId: store.id,
        sequenceStart: sequence,
      });
      sequence += checkoutStarted;

      for (let purchaseIndex = 0; purchaseIndex < purchases; purchaseIndex += 1) {
        const product = products[(purchaseIndex + dayOffset + storeIndex) % products.length];
        const occurredAt = new Date(dayDate);
        occurredAt.setUTCMinutes(40 + purchaseIndex * 3);
        const eventId = `evt_${String(sequence).padStart(6, '0')}`;

        events.push({
          eventId,
          storeId: store.id,
          eventType: 'purchase',
          occurredAt: occurredAt.toISOString(),
          productId: product.id,
          amountCents: product.amountCents,
          currency: store.currency,
          rawData: {
            product_id: product.id,
            amount: product.amountCents / 100,
            currency: store.currency,
          },
        });

        sequence += 1;
      }
    }
  });

  return events;
}

function pushEvents(
  events: SeedEvent[],
  input: {
    count: number;
    dayDate: Date;
    eventType: SeedEvent['eventType'];
    storeId: string;
    sequenceStart: number;
  },
) {
  for (let index = 0; index < input.count; index += 1) {
    const occurredAt = new Date(input.dayDate);
    occurredAt.setUTCMinutes(index);

    events.push({
      eventId: `evt_${String(input.sequenceStart + index).padStart(6, '0')}`,
      storeId: input.storeId,
      eventType: input.eventType,
      occurredAt: occurredAt.toISOString(),
      productId: null,
      amountCents: null,
      currency: null,
      rawData: {},
    });
  }
}

async function insertEvents(client: PoolClient, events: SeedEvent[]) {
  const values: unknown[] = [];
  const placeholders = events.map((event, index) => {
    const offset = index * 8;
    values.push(
      event.eventId,
      event.storeId,
      event.eventType,
      event.occurredAt,
      event.productId,
      event.amountCents,
      event.currency,
      JSON.stringify(event.rawData),
    );

    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}::timestamptz, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}::jsonb)`;
  });

  await client.query(
    `
      INSERT INTO events (
        event_id,
        store_id,
        event_type,
        occurred_at,
        product_id,
        amount_cents,
        currency,
        raw_data
      )
      VALUES ${placeholders.join(',\n')}
    `,
    values,
  );
}
