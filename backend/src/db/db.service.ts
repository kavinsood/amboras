import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResultRow } from 'pg';

export type DbTransactionClient = PoolClient;

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(configService: ConfigService) {
    this.pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
      max: Number(configService.get<string>('PG_POOL_MAX') ?? 10),
      idleTimeoutMillis: Number(
        configService.get<string>('PG_POOL_IDLE_TIMEOUT_MS') ?? 30000,
      ),
      connectionTimeoutMillis: Number(
        configService.get<string>('PG_POOL_CONNECTION_TIMEOUT_MS') ?? 2000,
      ),
    });
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ) {
    return this.pool.query<T>(text, params);
  }

  async withTransaction<T>(
    operation: (client: DbTransactionClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
