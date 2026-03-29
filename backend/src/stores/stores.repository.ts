import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';

interface StoreRow {
  id: string;
  name: string;
  timezone: string;
  currency: string;
}

@Injectable()
export class StoresRepository {
  constructor(private readonly db: DbService) {}

  async findStoreById(storeId: string) {
    const result = await this.db.query<StoreRow>(
      `
        SELECT id, name, timezone, currency
        FROM stores
        WHERE id = $1
      `,
      [storeId],
    );

    return result.rows[0] ?? null;
  }
}
