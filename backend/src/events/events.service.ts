import { BadRequestException, Injectable } from '@nestjs/common';
import { IngestEventDto } from '../common/dto/ingest-event.dto';
import { DbService } from '../db/db.service';
import { EventsRepository } from './events.repository';
import { RollupService } from './rollup.service';

@Injectable()
export class EventsService {
  constructor(
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

    return { accepted: true };
  }
}
