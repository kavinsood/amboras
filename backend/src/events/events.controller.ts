import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngestEventDto } from '../common/dto/ingest-event.dto';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  ingest(@Req() request: { user: Express.User }, @Body() dto: IngestEventDto) {
    return this.eventsService.ingest(request.user.storeId, dto);
  }
}
