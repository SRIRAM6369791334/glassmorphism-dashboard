import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Job, Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { AppConfig } from '../../config/app-config';
import { DatabaseService } from '../database/database.service';
import { OutboxProcessor } from './outbox-processor.service';

interface OutboxJob { outboxId: string }

@Injectable()
export class OutboxDispatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcher.name);
  private readonly producerConnection: Redis;
  private readonly workerConnection: Redis;
  private readonly queue: Queue<OutboxJob>;
  private worker?: Worker<OutboxJob>;
  private timer?: NodeJS.Timeout;
  private dispatching?: Promise<void>;
  private stopping = false;
  private lastMetricsAt = 0;

  constructor(
    private readonly database: DatabaseService,
    private readonly config: AppConfig,
    private readonly processor: OutboxProcessor,
  ) {
    const cfg = config.values;
    this.producerConnection = new Redis(cfg.redisUrl, {
      maxRetriesPerRequest: 1, connectTimeout: 5_000, commandTimeout: 5_000,
    });
    this.workerConnection = new Redis(cfg.redisUrl, { maxRetriesPerRequest: null });
    for (const connection of [this.producerConnection, this.workerConnection]) {
      connection.on('error', () => this.logger.warn({ event: 'queue_connection_error' }));
    }
    this.queue = new Queue<OutboxJob>(cfg.queueName, {
      connection: this.producerConnection,
      defaultJobOptions: {
        attempts: cfg.queueAttempts,
        backoff: { type: 'exponential', delay: cfg.queueBackoffMs },
        removeOnComplete: { age: 3_600, count: 1_000 },
        removeOnFail: { age: 7 * 86_400, count: 10_000 },
        stackTraceLimit: 1,
      },
    });
    this.queue.on('error', () => this.logger.warn({ event: 'queue_error' }));
  }

  async onModuleInit(): Promise<void> {
    const cfg = this.config.values;
    this.worker = new Worker<OutboxJob>(cfg.queueName,
      async (job: Job<OutboxJob>) => this.processor.process(job.data.outboxId), {
        connection: this.workerConnection,
        concurrency: cfg.workerConcurrency,
        lockDuration: cfg.outboxLeaseMs,
        metrics: { maxDataPoints: 1_440 },
      });
    this.worker.on('error', () => this.logger.error({ event: 'worker_connection_error' }));
    this.worker.on('failed', (job) => this.logger.warn({
      event: 'worker_job_failed', outboxId: job?.data.outboxId, attempt: job?.attemptsMade,
    }));
    await this.queue.waitUntilReady();
    this.tick();
    this.timer = setInterval(() => this.tick(), cfg.outboxPollMs);
  }

  private tick(): void {
    if (this.stopping || this.dispatching) return;
    this.dispatching = this.dispatch().catch(() => this.logger.warn({ event: 'outbox_dispatch_failed' }))
      .finally(() => { this.dispatching = undefined; });
  }

  async dispatch(): Promise<void> {
    const now = new Date();
    const cfg = this.config.values;
    const reclaimable: Prisma.OutboxEventWhereInput[] = [
      { status: 'PENDING' },
      { status: 'PROCESSING', lockedAt: { lte: new Date(now.getTime() - cfg.outboxLeaseMs) } },
    ];
    // A crash during the last attempt must not leave the event stuck indefinitely.
    await this.database.outboxEvent.updateMany({
      where: { eventType: { not: 'REQUEST_RECEIPT' }, attempts: { gte: cfg.queueAttempts }, OR: reclaimable },
      data: { status: 'FAILED', lockedAt: null, lockToken: null },
    });
    const rows = await this.database.outboxEvent.findMany({
      where: { eventType: { not: 'REQUEST_RECEIPT' }, attempts: { lt: cfg.queueAttempts },
        availableAt: { lte: now }, OR: reclaimable },
      orderBy: { availableAt: 'asc' }, take: cfg.outboxBatchSize,
      select: { id: true, status: true, lockToken: true },
    });
    for (const row of rows) {
      if (this.stopping) break;
      const nextDispatchAt = new Date(Date.now() + cfg.outboxLeaseMs);
      const leased = await this.database.outboxEvent.updateMany({
        where: { id: row.id, status: row.status, lockToken: row.lockToken, availableAt: { lte: now } },
        data: { availableAt: nextDispatchAt },
      });
      if (leased.count === 0) continue;
      try {
        const jobId = `outbox-${row.id.toString()}`;
        const existing = await this.queue.getJob(jobId);
        if (existing) {
          const state = await existing.getState();
          if (state === 'completed' || state === 'failed') await existing.remove();
        }
        await this.queue.add('deliver-outbox', { outboxId: row.id.toString() }, { jobId });
      } catch {
        // The DB record survives Redis failure and the dispatch lease also expires after a crash.
        await this.database.outboxEvent.updateMany({
          where: { id: row.id, availableAt: nextDispatchAt },
          data: { availableAt: new Date(Date.now() + cfg.queueBackoffMs) },
        });
        this.logger.warn({ event: 'outbox_enqueue_failed', outboxId: row.id.toString() });
      }
    }
    if (Date.now() - this.lastMetricsAt >= 30_000) {
      this.lastMetricsAt = Date.now();
      const counts = await this.queue.getJobCounts('waiting', 'active', 'delayed', 'failed');
      this.logger.log({ event: 'queue_depth', ...counts });
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    await this.dispatching;
    await this.worker?.close();
    await this.queue.close();
    this.producerConnection.disconnect();
    this.workerConnection.disconnect();
  }
}
