import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.client.on('error', (error) => {
      this.logger.debug(`Redis unavailable: ${error.message}`);
    });
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      await this.ensureConnection();
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds = 10): Promise<void> {
    try {
      await this.ensureConnection();
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      return;
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    try {
      await this.ensureConnection();
      await this.client.del(...keys);
    } catch {
      return;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.client.status !== 'end') {
        await this.client.quit();
      }
    } catch {
      return;
    }
  }

  private async ensureConnection() {
    if (this.client.status === 'wait') {
      await this.client.connect();
    }
  }
}
