import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngestEventDto } from '../common/dto/ingest-event.dto';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { EventsRateLimitGuard } from './events-rate-limit.guard';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(JwtAuthGuard, StoreAccessGuard, EventsRateLimitGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  ingest(
    @Req() request: {
      user: Express.User;
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
    },
    @Body() dto: IngestEventDto,
  ) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const visitorSource = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const visitorId = visitorSource?.split(',')[0]?.trim() || request.ip || null;

    return this.eventsService.ingest(request.user.storeId, dto, visitorId);
  }
}
