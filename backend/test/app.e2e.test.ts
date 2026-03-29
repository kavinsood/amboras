import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { AppModule } from '../src/app.module';
import { CacheService } from '../src/cache/cache.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DbService } from '../src/db/db.service';

type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

describe('App e2e', () => {
  let app: INestApplication;
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
  };

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('password123', 10);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DbService)
      .useValue(dbMock)
      .overrideProvider(CacheService)
      .useValue(cacheMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('logs in with valid seeded credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner1@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeString();
    expect(response.body.store.id).toBe('store_1');
  });

  test('rejects invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner1@example.com',
        password: 'wrong-password',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('rejects unauthenticated analytics access', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/analytics/overview',
    );

    expect(response.status).toBe(401);
  });

  test('rejects a payload whose store_id does not match the authenticated store', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner1@example.com',
        password: 'password123',
      });

    const response = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        event_id: 'evt_tenant_mismatch',
        store_id: 'store_2',
        event_type: 'purchase',
        timestamp: '2026-03-24T10:30:00Z',
        data: {
          product_id: 'prod_789',
          amount: 49.99,
          currency: 'USD',
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'store_id does not match authenticated store',
    );
  });

  test('rejects invalid DTO types before they reach the database', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner1@example.com',
        password: 'password123',
      });

    const response = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        event_id: 'evt_bad_amount',
        event_type: 'purchase',
        timestamp: '2026-03-24T10:30:00Z',
        data: {
          product_id: 'prod_789',
          amount: 'forty-nine',
          currency: 'USD',
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'data.amount must not be less than 0',
    );
  });

  test('returns tenant-scoped overview metrics for an authenticated store', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner1@example.com',
        password: 'password123',
      });

    const response = await request(app.getHttpServer())
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.revenue.todayCents).toBe(15700);
    expect(response.body.revenue.currency).toBe('USD');
    expect(response.body.eventCounts.page_view).toBe(636);
    expect(response.body.eventCounts.purchase).toBe(111);
    expect(response.body.conversionRate).toBe(0.1745);
  });

  test('returns ranked top products for the authenticated store', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner1@example.com',
        password: 'password123',
      });

    const response = await request(app.getHttpServer())
      .get('/api/v1/analytics/top-products?range=month')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.range).toBe('month');
    expect(response.body.currency).toBe('USD');
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0]).toEqual({
      productId: 'prod_789',
      revenueCents: 245000,
      purchaseCount: 42,
    });
  });

  test('rejects purchase events whose currency does not match the store currency', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'owner1@example.com',
        password: 'password123',
      });

    const response = await request(app.getHttpServer())
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({
        event_id: 'evt_bad_currency',
        event_type: 'purchase',
        timestamp: '2026-03-24T10:30:00Z',
        data: {
          product_id: 'prod_789',
          amount: 49.99,
          currency: 'EUR',
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Purchase currency does not match store currency');
  });
});
