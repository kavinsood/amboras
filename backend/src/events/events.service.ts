import { BadRequestException, Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { IngestEventDto } from '../common/dto/ingest-event.dto';
import { DbService } from '../db/db.service';
import { EventsRepository } from './events.repository';
import { RollupService } from './rollup.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly db: DbService,
    private readonly eventsRepository: EventsRepository,
    private readonly rollupService: RollupService,
  ) {}

  async ingest(storeId: string, dto: IngestEventDto) {
    if (dto.store_id && dto.store_id !== storeId) {
      throw new BadRequestException('store_id does not match authenticated store');
    }

    await this.db.withTransaction(async (client) => {
      await this.eventsRepository.insertEvent(storeId, dto, client);
      await this.rollupService.applyEvent(storeId, dto, client);
    });

    await this.cacheService.del(
      `analytics:overview:${storeId}`,
      `analytics:top-products:${storeId}:today`,
      `analytics:top-products:${storeId}:week`,
      `analytics:top-products:${storeId}:month`,
      `analytics:trend:${storeId}:7`,
      `analytics:trend:${storeId}:14`,
      `analytics:trend:${storeId}:30`,
    );

    return { accepted: true };
  }
}
