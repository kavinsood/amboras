import { Injectable } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { AnalyticsQueryDto } from '../common/dto/analytics-query.dto';
import { AnalyticsRepository } from './analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getOverview(storeId: string) {
    const cacheKey = `analytics:overview:${storeId}`;
    const cached = await this.cacheService.getJson<Awaited<ReturnType<AnalyticsRepository['getOverview']>>>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.analyticsRepository.getOverview(storeId);
    await this.cacheService.setJson(cacheKey, result, 10);
    return result;
  }

  async getTopProducts(storeId: string, query: AnalyticsQueryDto) {
    const cacheKey = `analytics:top-products:${storeId}:${query.range}`;
    const cached = await this.cacheService.getJson<Awaited<ReturnType<AnalyticsRepository['getTopProducts']>>>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.analyticsRepository.getTopProducts(storeId, query);
    await this.cacheService.setJson(cacheKey, result, 15);
    return result;
  }

  getRecentActivity(storeId: string) {
    return this.analyticsRepository.getRecentActivity(storeId);
  }

  async getTrend(storeId: string, days: number) {
    const cacheKey = `analytics:trend:${storeId}:${days}`;
    const cached =
      await this.cacheService.getJson<
        Awaited<ReturnType<AnalyticsRepository['getTrend']>>
      >(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.analyticsRepository.getTrend(storeId, days);
    await this.cacheService.setJson(cacheKey, result, 15);
    return result;
  }
}
