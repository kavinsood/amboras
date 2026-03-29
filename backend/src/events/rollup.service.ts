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

    const column = eventColumnMap[dto.event_type];
    const upsertStoreMetricsSql = `
      INSERT INTO store_daily_metrics (
        store_id,
        bucket_date,
        ${column},
        revenue_cents
      )
      VALUES ($1, ($2::timestamptz AT TIME ZONE $3)::date, 1, $4)
      ON CONFLICT (store_id, bucket_date)
      DO UPDATE SET
        ${column} = store_daily_metrics.${column} + 1,
        revenue_cents = store_daily_metrics.revenue_cents + EXCLUDED.revenue_cents
    `;
    const storeMetricsParams = [
      storeId,
      dto.timestamp,
      store.timezone,
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
      VALUES ($1, $2, ($3::timestamptz AT TIME ZONE $4)::date, 1, $5)
      ON CONFLICT (store_id, product_id, bucket_date)
      DO UPDATE SET
        purchase_count = product_daily_revenue.purchase_count + 1,
        revenue_cents = product_daily_revenue.revenue_cents + EXCLUDED.revenue_cents
    `;
    const productRevenueParams = [
      storeId,
      dto.data.product_id,
      dto.timestamp,
      store.timezone,
      amountCents,
    ];

    if (client) {
      await client.query(upsertProductRevenueSql, productRevenueParams);
    } else {
      await this.db.query(upsertProductRevenueSql, productRevenueParams);
    }
  }
}
