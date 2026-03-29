import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';
import { RollupService } from './rollup.service';

@Module({
  imports: [StoresModule],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository, RollupService],
})
export class EventsModule {}
