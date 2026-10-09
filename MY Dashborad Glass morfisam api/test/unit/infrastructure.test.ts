import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type ExecutionContext } from '@nestjs/common';
import { type OutboxEvent } from '@prisma/client';
import { readConfig, AppConfig } from '../../src/config/app-config';
import { canonical } from '../../src/common/idempotency/idempotency.service';
import { seal, unseal } from '../../src/common/security/crypto';
import { RateLimitGuard } from '../../src/common/guards/rate-limit.guard';
import { ApiError } from '../../src/common/errors/api-error';
import { RedisService } from '../../src/infrastructure/redis/redis.service';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { EmailService } from '../../src/infrastructure/email/email.service';
import { OutboxProcessor } from '../../src/infrastructure/queue/outbox-processor.service';

const env = { DATABASE_URL: 'mysql://test:unused@localhost/test', REDIS_URL: 'redis://localhost:6379', JWT_ACCESS_SECRET: 'a'.repeat(32), TOKEN_HASH_SECRET: 'b'.repeat(32), OTP_SECRET: 'c'.repeat(32), RECEIPT_SECRET: 'd'.repeat(32) };
const config = { values: readConfig(env) } as AppConfig;

test('config rejects weak/shared secrets, broad production CORS and unsafe pool sizes', () => {
  assert.throws(() => readConfig({ ...env, JWT_ACCESS_SECRET: 'short' }));
  assert.throws(() => readConfig({ ...env, JWT_ACCESS_SECRET: env.OTP_SECRET }));
  assert.throws(() => readConfig({ ...env, DB_POOL_SIZE: '500' }));
  assert.throws(() => readConfig({ ...env, NODE_ENV: 'production', CORS_ORIGINS: '*' }));
  assert.throws(() => readConfig({ ...env, OUTBOX_LEASE_MS: '30000', EMAIL_TIMEOUT_MS: '30000' }));
  assert.throws(() => readConfig({ ...env, DATABASE_URL: 'malformed-with-a-secret' }), { message: 'Invalid configuration: DATABASE_URL' });
  assert.equal(config.values.passwordMinLength, 12);
});

test('receipt encryption hides bearer tokens and authenticates stored responses', () => {
  const value = { resetToken: 'a-very-sensitive-token' }; const encrypted = seal(value, env.RECEIPT_SECRET);
  assert.ok(!encrypted.includes(value.resetToken)); assert.deepEqual(unseal(encrypted, env.RECEIPT_SECRET), value);
  const tampered = Buffer.from(encrypted, 'base64url'); tampered[tampered.length - 1] ^= 1;
  assert.throws(() => unseal(tampered.toString('base64url'), env.RECEIPT_SECRET));
  assert.throws(() => unseal(encrypted, 'wrong-secret'));
  assert.equal(canonical({ z: 1, a: { c: 3, b: 2 } }), canonical({ a: { b: 2, c: 3 }, z: 1 }));
});

test('distributed rate limit enforces IP and account subjects and fails closed on Redis loss', async () => {
  const keys: string[] = []; const headers: Record<string, number> = {};
  let count = 1;
  const redis = { client: { eval: async (_script: string, _keys: number, key: string) => { keys.push(key); return [count, 45]; } } } as unknown as RedisService;
  const context = { switchToHttp: () => ({ getRequest: () => ({ path: '/api/v1/auth/login', body: { email: ' Person@Example.com ' }, ip: '127.0.0.1' }), getResponse: () => ({ setHeader: (name: string, value: number) => { headers[name] = value; } }) }) } as unknown as ExecutionContext;
  const guard = new RateLimitGuard(redis, config);
  assert.equal(await guard.canActivate(context), true); assert.equal(keys.length, 2);
  assert.ok(keys.every(key => !key.includes('Person') && !key.includes('127.0.0.1')));
  count = 100;
  await assert.rejects(guard.canActivate(context), error => error instanceof ApiError && error.getStatus() === 429);
  assert.equal(headers['Retry-After'], 45);
  redis.client.eval = (async () => { throw new Error('Redis unavailable'); }) as typeof redis.client.eval;
  await assert.rejects(guard.canActivate(context), error => error instanceof ApiError && error.getStatus() === 503);
});

test('outbox email failures persist retry state and sanitize queue error details', async () => {
  const updates: Array<{ status?: string; availableAt?: Date }> = [];
  const row = { id: 1n, eventType: 'EMAIL_VERIFICATION_REQUESTED', payload: { otpId: '11111111-1111-4111-8111-111111111111' }, attempts: 1 } as unknown as OutboxEvent;
  const db = {
    outboxEvent: { updateMany: async ({ data }: { data: { status?: string; availableAt?: Date } }) => { updates.push(data); return { count: 1 }; }, findUniqueOrThrow: async () => row },
    emailOtp: { findUnique: async () => ({ publicId: row.payload && (row.payload as { otpId: string }).otpId, purpose: 'SIGNUP', expiresAt: new Date(Date.now() + 60_000), attempts: 0, user: { email: 'test@example.test', status: 'PENDING_VERIFICATION' } }) },
  } as unknown as DatabaseService;
  const email = { sendOtp: async () => { throw new Error('Provider echoed sensitive code and credential'); } } as unknown as EmailService;
  const processor = new OutboxProcessor(db, email, config);
  await assert.rejects(processor.process('1'), { message: 'OUTBOX_DELIVERY_FAILED' });
  assert.equal(updates.at(-1)?.status, 'PENDING'); assert.ok(updates.at(-1)?.availableAt);
  row.attempts = config.values.queueAttempts;
  await assert.rejects(processor.process('1'), { message: 'OUTBOX_DELIVERY_FAILED' });
  assert.equal(updates.at(-1)?.status, 'FAILED');
});

test('outbox skips consumed codes and rejects invalid queue IDs without sending email', async () => {
  let sends = 0;
  const db = { outboxEvent: { updateMany: async () => ({ count: 1 }), findUniqueOrThrow: async () => ({ id: 1n, eventType: 'EMAIL_VERIFICATION_REQUESTED', payload: { otpId: '11111111-1111-4111-8111-111111111111' }, attempts: 1 }) }, emailOtp: { findUnique: async () => ({ verifiedAt: new Date() }) } } as unknown as DatabaseService;
  const processor = new OutboxProcessor(db, { sendOtp: async () => { sends++; } } as unknown as EmailService, config);
  await processor.process('1'); assert.equal(sends, 0);
  await assert.rejects(processor.process('invalid'), { message: 'INVALID_OUTBOX_ID' });
});
