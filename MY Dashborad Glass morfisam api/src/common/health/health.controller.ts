import { Controller, Get, OnModuleDestroy, Req, Res } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { Response } from 'express';
import { AppConfig } from '../../config/app-config';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ApiError } from '../errors/api-error';
import type { ApiRequest } from '../http/request-context';
import { MetricsService } from '../observability/metrics.service';
import { constantEqual } from '../security/crypto';

@Controller()
export class HealthController implements OnModuleDestroy {
  private queue?: Queue;
  constructor(private readonly db: DatabaseService, private readonly redis: RedisService, private readonly config: AppConfig, private readonly metrics: MetricsService) {}
  @Get('health/live') live() { return { success: true, data: { status: 'alive' } }; }
  @Get('health/ready') async ready() {
    try {
      const dbStart = performance.now(); await this.db.$queryRaw`SELECT 1`;
      this.metrics.recordDependency('mysql', (performance.now() - dbStart) / 1000);
      const redisStart = performance.now(); await this.redis.client.ping();
      this.metrics.recordDependency('redis', (performance.now() - redisStart) / 1000);
      return { success: true, data: { status: 'ready' } };
    } catch { throw new ApiError(503, 'NOT_READY', 'The service is not ready.'); }
  }
  @Get('metrics') async scrape(@Req() req: ApiRequest, @Res() res: Response) {
    const cfg = this.config.values;
    if (cfg.metricsToken && !constantEqual(req.get('Authorization') ?? '', `Bearer ${cfg.metricsToken}`)) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
    this.queue ??= new Queue(cfg.queueName, { connection: this.redis.client });
    try {
      const counts = await this.queue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed');
      for (const [state, count] of Object.entries(counts)) this.metrics.queueDepth.set({ state }, count);
      const threads = await this.db.$queryRaw<Array<{ Variable_name: string; Value: string }>>`SHOW STATUS LIKE 'Threads_connected'`;
      this.metrics.dbConnections.set(Number(threads[0]?.Value ?? 0));
      const info = await this.redis.client.info();
      const field = (name: string) => Number(new RegExp(`^${name}:(\\d+)`, 'm').exec(info)?.[1] ?? 0);
      this.metrics.redisCache.set({ outcome: 'hit' }, field('keyspace_hits'));
      this.metrics.redisCache.set({ outcome: 'miss' }, field('keyspace_misses'));
      this.metrics.redisMemory.set(field('used_memory'));
    } catch { throw new ApiError(503, 'METRICS_UNAVAILABLE', 'Metrics are temporarily unavailable.'); }
    res.type(this.metrics.registry.contentType).send(await this.metrics.registry.metrics());
  }
  async onModuleDestroy() { await this.queue?.close(); }
}
