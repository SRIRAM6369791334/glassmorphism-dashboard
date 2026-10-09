import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { AppConfig } from '../../config/app-config';
import { MetricsService } from '../../common/observability/metrics.service';

@Injectable()
export class DatabaseService extends PrismaClient<Prisma.PrismaClientOptions, 'query'> implements OnModuleInit, OnApplicationShutdown {
  constructor(config: AppConfig, metrics: MetricsService) {
    super({ datasources: { db: { url: config.values.databaseUrl } }, log: [{ emit: 'event', level: 'query' }] });
    this.$on('query', (event) => metrics.dbQueries.observe(event.duration / 1000));
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
