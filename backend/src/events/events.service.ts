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

  async ingest(storeId: string, dto: IngestEventDto, visitorId?: string | null) {
    if (dto.store_id && dto.store_id !== storeId) {
      throw new BadRequestException('store_id does not match authenticated store');
    }

    await this.db.withTransaction(async (client) => {
      await this.eventsRepository.insertEvent(storeId, dto, client);
      await this.rollupService.applyEvent(storeId, dto, client);
    });

    if (dto.event_type === 'page_view' && visitorId) {
      await this.cacheService.pfadd(`analytics:live-visitors:${storeId}`, visitorId);
      await this.cacheService.expire(`analytics:live-visitors:${storeId}`, 300);
    }

    return { accepted: true };
  }
}
