import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IngestEventDto } from '../common/dto/ingest-event.dto';
import { DbService, DbTransactionClient } from '../db/db.service';
import { StoresRepository } from '../stores/stores.repository';

type RollupColumn =
  | 'page_views'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'purchases';

const eventColumnMap: Record<IngestEventDto['event_type'], RollupColumn> = {
  page_view: 'page_views',
  add_to_cart: 'add_to_cart',
  remove_from_cart: 'remove_from_cart',
  checkout_started: 'checkout_started',
  purchase: 'purchases',
};

@Injectable()
export class RollupService {
  constructor(
    private readonly db: DbService,
    private readonly storesRepository: StoresRepository,
  ) {}

  async applyEvent(
    storeId: string,
    dto: IngestEventDto,
    client?: DbTransactionClient,
  ) {
    const store = await this.storesRepository.findStoreById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const amountCents =
      typeof dto.data.amount === 'number' ? Math.round(dto.data.amount * 100) : 0;

    if (dto.event_type === 'purchase') {
      if (typeof dto.data.amount !== 'number') {
        throw new BadRequestException('Purchase events require an amount');
      }

      if (!dto.data.currency) {
        throw new BadRequestException('Purchase events require a currency');
      }

      if (dto.data.currency !== store.currency) {
        throw new BadRequestException('Purchase currency does not match store currency');
      }
    }

    const bucketDate = getBucketDate(dto.timestamp, store.timezone);
    const column = eventColumnMap[dto.event_type];
    const upsertStoreMetricsSql = `
      INSERT INTO store_daily_metrics (
        store_id,
        bucket_date,
        ${column},
        revenue_cents
      )
      VALUES ($1, $2::date, 1, $3)
      ON CONFLICT (store_id, bucket_date)
      DO UPDATE SET
        ${column} = store_daily_metrics.${column} + 1,
        revenue_cents = store_daily_metrics.revenue_cents + EXCLUDED.revenue_cents
    `;
    const storeMetricsParams = [
      storeId,
      bucketDate,
      dto.event_type === 'purchase' ? amountCents : 0,
    ];

    if (client) {
      await client.query(upsertStoreMetricsSql, storeMetricsParams);
    } else {
      await this.db.query(upsertStoreMetricsSql, storeMetricsParams);
    }

    if (dto.event_type !== 'purchase' || !dto.data.product_id) {
      return;
    }

    const upsertProductRevenueSql = `
      INSERT INTO product_daily_revenue (
        store_id,
        product_id,
        bucket_date,
        purchase_count,
        revenue_cents
      )
      VALUES ($1, $2, $3::date, 1, $4)
      ON CONFLICT (store_id, product_id, bucket_date)
      DO UPDATE SET
        purchase_count = product_daily_revenue.purchase_count + 1,
        revenue_cents = product_daily_revenue.revenue_cents + EXCLUDED.revenue_cents
    `;
    const productRevenueParams = [storeId, dto.data.product_id, bucketDate, amountCents];

    if (client) {
      await client.query(upsertProductRevenueSql, productRevenueParams);
    } else {
      await this.db.query(upsertProductRevenueSql, productRevenueParams);
    }
  }
}

function getBucketDate(timestamp: string, timeZone: string): string {
  const date = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Unable to derive bucket date');
  }

  return `${year}-${month}-${day}`;
}
