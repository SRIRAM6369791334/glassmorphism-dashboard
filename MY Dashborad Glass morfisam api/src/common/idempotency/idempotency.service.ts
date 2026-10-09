import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '../../config/app-config';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ApiError } from '../errors/api-error';
import { digest, seal, unseal } from '../security/crypto';

export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
}

@Injectable()
export class IdempotencyService {
  constructor(private readonly db: DatabaseService, private readonly redis: RedisService, private readonly config: AppConfig) {}

  async run<T>(operation: string, key: string | undefined, payload: unknown, action: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    if (!key || !/^[a-zA-Z0-9_-]{16,128}$/.test(key)) throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Supply a unique Idempotency-Key for this request.');
    const cfg = this.config.values;
    const dedupeKey = `request-${digest(`${operation}:${key}`, cfg.receiptSecret)}`;
    const fingerprint = digest(canonical(payload), cfg.receiptSecret);
    const existing = await this.db.outboxEvent.findUnique({ where: { dedupeKey } });
    const replay = (record: NonNullable<typeof existing>): T => {
      const receipt = record.payload as { fingerprint?: string; response?: string };
      if (receipt.fingerprint !== fingerprint) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'This retry key belongs to a different request.');
      // Expired receipts remain tombstones: never re-execute a possibly completed write.
      if (record.availableAt < new Date() || !receipt.response) throw new ApiError(409, 'IDEMPOTENCY_EXPIRED', 'This retry window has ended. Check the account state before starting a new request.');
      return unseal<T>(receipt.response, cfg.receiptSecret);
    };
    if (existing) return replay(existing);
    const lockKey = `idem:${dedupeKey}`; const owner = randomUUID();
    let locked: string | null;
    try { locked = await this.redis.client.set(lockKey, owner, 'PX', 30_000, 'NX'); }
    catch { throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Please try again with the same request key.'); }
    if (!locked) throw new ApiError(409, 'REQUEST_IN_PROGRESS', 'This request is still being processed. Retry with the same request key.');
    try {
      return await this.db.$transaction(async (tx) => {
        const previous = await tx.outboxEvent.findUnique({ where: { dedupeKey } });
        if (previous) return replay(previous);
        const record = await tx.outboxEvent.create({ data: {
          eventType: 'REQUEST_RECEIPT', aggregateType: 'request', aggregateId: operation, dedupeKey,
          payload: { fingerprint }, status: 'COMPLETED', availableAt: new Date(Date.now() + cfg.idempotencyTtlSeconds * 1000),
        } });
        const response = await action(tx);
        await tx.outboxEvent.update({ where: { id: record.id }, data: { payload: { fingerprint, response: seal(response, cfg.receiptSecret) }, processedAt: new Date() } });
        return response;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15_000, maxWait: 5000 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const receipt = await this.db.outboxEvent.findUnique({ where: { dedupeKey } });
        if (receipt) return replay(receipt);
      }
      throw error;
    } finally {
      // Never mask a committed operation if Redis fails while releasing its hint lock.
      await this.redis.client.eval("if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", 1, lockKey, owner).catch(() => undefined);
    }
  }
}
