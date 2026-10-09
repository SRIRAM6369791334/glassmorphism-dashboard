import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from '../config/app-config';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { IdempotencyService } from './idempotency/idempotency.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { TelemetryModule } from './observability/metrics.service';
import { HealthController } from './health/health.controller';

@Global()
@Module({
  imports: [AppConfigModule, DatabaseModule, RedisModule, TelemetryModule],
  providers: [IdempotencyService, { provide: APP_GUARD, useClass: RateLimitGuard }],
  controllers: [HealthController], exports: [IdempotencyService],
})
export class CoreModule {}
