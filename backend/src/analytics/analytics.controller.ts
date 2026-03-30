import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { StoreAccessGuard } from '../common/guards/store-access.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  overview(@Req() request: { user: Express.User }) {
    return this.analyticsService.getOverview(request.user.storeId);
  }

  @Get('top-products')
  topProducts(
    @Req() request: { user: Express.User },
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getTopProducts(request.user.storeId, query);
  }

  @Get('recent-activity')
  recentActivity(@Req() request: { user: Express.User }) {
    return this.analyticsService.getRecentActivity(request.user.storeId);
  }

  @Get('trend')
  trend(
    @Req() request: { user: Express.User },
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getTrend(request.user.storeId, query.days);
  }

  @Get('live-visitors')
  liveVisitors(@Req() request: { user: Express.User }) {
    return this.analyticsService.getLiveVisitors(request.user.storeId);
  }
}
