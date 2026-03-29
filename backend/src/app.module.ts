import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { DbModule } from './db/db.module';
import { EventsModule } from './events/events.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule,
    DbModule,
    AuthModule,
    AnalyticsModule,
    EventsModule,
    StoresModule,
  ],
})
export class AppModule {}
