import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '../../config/app-config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(config: AppConfig) {
    this.client = new Redis(config.values.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
      commandTimeout: 5_000,
      enableOfflineQueue: false,
    });
    // IORedis errors can contain credentials or infrastructure addresses.
    this.client.on('error', () => this.logger.warn({ event: 'redis_connection_error' }));
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}
