import { ConflictException, Injectable } from '@nestjs/common';
import { IngestEventDto } from '../common/dto/ingest-event.dto';
import { DbService, DbTransactionClient } from '../db/db.service';

@Injectable()
export class EventsRepository {
  constructor(private readonly db: DbService) {}

  async insertEvent(
    storeId: string,
    dto: IngestEventDto,
    client?: DbTransactionClient,
  ) {
    const amountCents =
      typeof dto.data.amount === 'number' ? Math.round(dto.data.amount * 100) : null;

    const result = client
      ? await client.query<{ event_id: string }>(
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
            VALUES ($1, $2, $3, $4::timestamptz, $5, $6, $7, $8::jsonb)
            ON CONFLICT (event_id) DO NOTHING
            RETURNING event_id
          `,
          [
            dto.event_id,
            storeId,
            dto.event_type,
            dto.timestamp,
            dto.data.product_id ?? null,
            amountCents,
            dto.data.currency ?? null,
            JSON.stringify(dto.data),
          ],
        )
      : await this.db.query<{ event_id: string }>(
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
        VALUES ($1, $2, $3, $4::timestamptz, $5, $6, $7, $8::jsonb)
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
      `,
      [
        dto.event_id,
        storeId,
        dto.event_type,
        dto.timestamp,
        dto.data.product_id ?? null,
        amountCents,
        dto.data.currency ?? null,
        JSON.stringify(dto.data),
      ],
    );

    if (result.rowCount === 0) {
      throw new ConflictException(`Event ${dto.event_id} already exists`);
    }
  }
}
