import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { AppModule } from '../src/app.module';
import { AuthController } from '../src/auth/auth.controller';
import { AnalyticsController } from '../src/analytics/analytics.controller';
import { CacheService } from '../src/cache/cache.service';
import { IngestEventDto } from '../src/common/dto/ingest-event.dto';
import { EventsController } from '../src/events/events.controller';
import { DbService } from '../src/db/db.service';

type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

function buildEvent(overrides: Partial<IngestEventDto> = {}): IngestEventDto {
  return {
    event_id: 'evt_123',
    event_type: 'purchase',
    timestamp: '2026-03-24T10:30:00Z',
    data: {
      product_id: 'prod_789',
      amount: 49.99,
      currency: 'USD',
    },
    ...overrides,
  };
}

describe('App integration', () => {
  let moduleRef: TestingModule;
  let authController: AuthController;
  let analyticsController: AnalyticsController;
  let eventsController: EventsController;
  let passwordHash: string;

  const dbMock = {
    query: async <T>(text: string, params: unknown[] = []): Promise<QueryResult<T>> => {
      if (text.includes('FROM users')) {
        const email = params[0];
        if (email === 'owner1@example.com') {
          return {
            rowCount: 1,
            rows: [
              {
                user_id: 'user_1',
                email: 'owner1@example.com',
                password_hash: passwordHash,
                store_id: 'store_1',
                store_name: 'Northwind Store',
                timezone: 'America/Los_Angeles',
                currency: 'USD',
              } as T,
            ],
          };
        }

        return {
          rowCount: 0,
          rows: [],
        };
      }

      if (text.includes('FROM stores')) {
        const storeId = params[0];
        if (storeId === 'store_1') {
          return {
            rowCount: 1,
            rows: [
              {
                id: 'store_1',
                name: 'Northwind Store',
                timezone: 'America/Los_Angeles',
                currency: 'USD',
              } as T,
            ],
          };
        }

        return {
          rowCount: 0,
          rows: [],
        };
      }

      if (text.includes('FROM store_daily_metrics')) {
        return {
          rowCount: 1,
          rows: [
            {
              today_cents: '15700',
              week_cents: '255300',
              month_cents: '1074900',
              page_views_total: '636',
              add_to_cart_total: '210',
              remove_from_cart_total: '42',
              checkout_started_total: '139',
              purchases_total: '111',
            } as T,
          ],
        };
      }

      if (text.includes('FROM product_daily_revenue')) {
        return {
          rowCount: 2,
          rows: [
            {
              product_id: 'prod_789',
              revenue_cents: '245000',
              purchase_count: '42',
            } as T,
            {
              product_id: 'prod_456',
              revenue_cents: '182500',
              purchase_count: '31',
            } as T,
          ],
        };
      }

      if (text.includes('FROM events') && text.includes('ORDER BY occurred_at DESC')) {
        return {
          rowCount: 2,
          rows: [
            {
              event_id: 'evt_recent_1',
              event_type: 'purchase',
              occurred_at: new Date('2026-03-24T10:30:00Z'),
              product_id: 'prod_789',
              amount_cents: 4999,
              currency: 'USD',
            } as T,
            {
              event_id: 'evt_recent_2',
              event_type: 'page_view',
              occurred_at: new Date('2026-03-24T10:28:00Z'),
              product_id: null,
              amount_cents: null,
              currency: null,
            } as T,
          ],
        };
      }

      if (text.includes('generate_series')) {
        return {
          rowCount: 2,
          rows: [
            {
              bucket_date: '2026-03-23',
              revenue_cents: '12000',
              purchases: '3',
              page_views: '14',
            } as T,
            {
              bucket_date: '2026-03-24',
              revenue_cents: '15700',
              purchases: '4',
              page_views: '18',
            } as T,
          ],
        };
      }

      if (text.includes('INSERT INTO events')) {
        return {
          rowCount: 1,
          rows: [{ event_id: params[0] as T }] as T[],
        };
      }

      return {
        rowCount: 0,
        rows: [],
      };
    },
    withTransaction: async (
      operation: (client: { query: typeof dbMock.query }) => Promise<unknown>,
    ) => operation({ query: dbMock.query }),
  };

  const cacheMock = {
    getJson: async () => null,
    setJson: async () => undefined,
    del: async () => undefined,
    pfadd: async () => undefined,
    pfcount: async () => 12,
    expire: async () => undefined,
  };

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('password123', 10);

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DbService)
      .useValue(dbMock)
      .overrideProvider(CacheService)
      .useValue(cacheMock)
      .compile();

    authController = moduleRef.get(AuthController);
    analyticsController = moduleRef.get(AnalyticsController);
    eventsController = moduleRef.get(EventsController);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  test('logs in with valid seeded credentials', async () => {
    const response = await authController.login({
      email: 'owner1@example.com',
      password: 'password123',
    });

    expect(response.accessToken).toBeString();
    expect(response.store.id).toBe('store_1');
  });

  test('rejects invalid credentials', async () => {
    await expect(
      authController.login({
        email: 'owner1@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  test('rejects invalid DTO types before they reach the database', async () => {
    const validationPipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    });

    try {
      await validationPipe.transform(
        {
          event_id: 'evt_bad_amount',
          event_type: 'purchase',
          timestamp: '2026-03-24T10:30:00Z',
          data: {
            product_id: 'prod_789',
            amount: 'forty-nine',
            currency: 'USD',
          },
        },
        {
          type: 'body',
          metatype: IngestEventDto,
        },
      );
      throw new Error('Expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse();
      expect(JSON.stringify(response)).toContain('amount');
    }
  });

  test('rejects a payload whose store_id does not match the authenticated store', async () => {
    await expect(
      eventsController.ingest(
        {
          user: { storeId: 'store_1' } as Express.User,
        } as never,
        buildEvent({ store_id: 'store_2' }),
      ),
    ).rejects.toThrow('store_id does not match authenticated store');
  });

  test('rejects purchase events whose currency does not match the store currency', async () => {
    const loginResponse = await authController.login({
      email: 'owner1@example.com',
      password: 'password123',
    });

    await expect(
      eventsController.ingest(
        {
          user: { storeId: loginResponse.store.id } as Express.User,
        } as never,
        buildEvent({
          event_id: 'evt_bad_currency',
          data: {
            product_id: 'prod_789',
            amount: 49.99,
            currency: 'EUR',
          },
        }),
      ),
    ).rejects.toThrow('Purchase currency does not match store currency');
  });

  test('returns tenant-scoped overview metrics for an authenticated store', async () => {
    const loginResponse = await authController.login({
      email: 'owner1@example.com',
      password: 'password123',
    });

    const response = await analyticsController.overview({
      user: { storeId: loginResponse.store.id } as Express.User,
    } as never);

    expect(response.revenue.todayCents).toBe(15700);
    expect(response.revenue.currency).toBe('USD');
    expect(response.eventCounts.page_view).toBe(636);
    expect(response.eventCounts.purchase).toBe(111);
    expect(response.conversionRate).toBe(0.1745);
  });

  test('returns ranked top products for the authenticated store', async () => {
    const loginResponse = await authController.login({
      email: 'owner1@example.com',
      password: 'password123',
    });

    const response = await analyticsController.topProducts(
      {
        user: { storeId: loginResponse.store.id } as Express.User,
      } as never,
      { range: 'month' } as never,
    );

    expect(response.range).toBe('month');
    expect(response.currency).toBe('USD');
    expect(response.items).toHaveLength(2);
    expect(response.items[0]).toEqual({
      productId: 'prod_789',
      revenueCents: 245000,
      purchaseCount: 42,
    });
  });

  test('returns a trend series for the authenticated store', async () => {
    const loginResponse = await authController.login({
      email: 'owner1@example.com',
      password: 'password123',
    });

    const response = await analyticsController.trend(
      {
        user: { storeId: loginResponse.store.id } as Express.User,
      } as never,
      { days: 14 } as never,
    );

    expect(response.currency).toBe('USD');
    expect(response.items).toHaveLength(2);
    expect(response.items[0]).toEqual({
      date: '2026-03-23',
      revenueCents: 12000,
      purchases: 3,
      pageViews: 14,
      conversionRate: 0.2143,
    });
    expect(response.items[1]).toEqual({
      date: '2026-03-24',
      revenueCents: 15700,
      purchases: 4,
      pageViews: 18,
      conversionRate: 0.2222,
    });
  });

  test('returns live visitor counts for the authenticated store', async () => {
    const loginResponse = await authController.login({
      email: 'owner1@example.com',
      password: 'password123',
    });

    const response = await analyticsController.liveVisitors({
      user: { storeId: loginResponse.store.id } as Express.User,
    } as never);

    expect(response.count).toBe(12);
  });
});
