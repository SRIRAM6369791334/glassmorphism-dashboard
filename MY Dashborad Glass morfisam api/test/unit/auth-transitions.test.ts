import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { ExecutionContext } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../src/common/errors/api-error';
import { AuthGuard } from '../../src/common/guards/auth.guard';
import { IdempotencyService } from '../../src/common/idempotency/idempotency.service';
import { digest, otpCode } from '../../src/common/security/crypto';
import { AppConfig } from '../../src/config/app-config';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { hashPassword, opaqueToken, signAccessToken } from '../../src/modules/auth/security';
import { RolesService } from '../../src/modules/roles/roles.service';

const values = {
  otpSecret: 'test-otp-secret', tokenHashSecret: 'test-token-secret', otpMaxAttempts: 5,
  otpTtlSeconds: 300, otpCooldownSeconds: 60, passwordMinLength: 12,
  resetTokenTtlSeconds: 600, refreshTokenTtlSeconds: 2_592_000,
  jwtAccessSecret: 'test-access-secret', jwtIssuer: 'test-api', jwtAudience: 'test-web', accessTokenTtlSeconds: 900,
};
const config = { values } as unknown as AppConfig;
const context = { requestId: 'test-request' };
const isCode = (code: string) => (error: unknown) => error instanceof ApiError && (error.getResponse() as { code: string }).code === code;

function otpHarness() {
  const publicId = randomUUID();
  const code = otpCode(publicId, values.otpSecret);
  const user = { id: 1n, publicId: randomUUID(), email: 'test@example.com', status: 'PENDING_VERIFICATION', deletedAt: null };
  const otp = {
    id: 2n, publicId, attempts: 0, expiresAt: new Date(Date.now() + 300_000), verifiedAt: null as Date | null,
    invalidatedAt: null as Date | null, otpHash: digest(`${publicId}:${code}`, values.otpSecret),
  };
  let commits = 0;
  const tx = {
    $queryRaw: async () => [{ id: 1n }],
    user: { findUnique: async () => user, update: async ({ data }: { data: { status: string } }) => { user.status = data.status; return user; } },
    emailOtp: {
      findFirst: async () => otp.verifiedAt || otp.invalidatedAt ? null : otp,
      updateMany: async ({ data }: { data: { verifiedAt?: Date; invalidatedAt?: Date } }) => {
        otp.attempts += 1;
        otp.verifiedAt = data.verifiedAt ?? otp.verifiedAt;
        otp.invalidatedAt = data.invalidatedAt ?? otp.invalidatedAt;
        return { count: 1 };
      },
    },
    auditLog: { create: async () => ({}) },
  } as unknown as Prisma.TransactionClient;
  const idempotency = { run: async <T>(_operation: string, _key: string, _payload: unknown, action: (transaction: Prisma.TransactionClient) => Promise<T>) => {
    const result = await action(tx); commits += 1; return result;
  } } as unknown as IdempotencyService;
  const service = new AuthService({} as DatabaseService, config, idempotency, new RolesService());
  return { service, otp, user, code, commits: () => commits };
}

test('invalid OTP increments and commits attempts before returning a client error', async () => {
  const state = otpHarness();
  await assert.rejects(state.service.verifyEmail({ email: state.user.email, otp: state.code === '000000' ? '111111' : '000000' }, 'test-key', context), isCode('INVALID_OTP'));
  assert.equal(state.otp.attempts, 1);
  assert.equal(state.commits(), 1);
  assert.equal(state.user.status, 'PENDING_VERIFICATION');
});

test('fifth invalid OTP exhausts the code and a subsequent correct code cannot activate account', async () => {
  const state = otpHarness();
  state.otp.attempts = 4;
  await assert.rejects(state.service.verifyEmail({ email: state.user.email, otp: state.code === '000000' ? '111111' : '000000' }, 'test-key', context), isCode('INVALID_OTP'));
  assert.equal(state.otp.attempts, 5);
  assert.ok(state.otp.invalidatedAt);
  await assert.rejects(state.service.verifyEmail({ email: state.user.email, otp: state.code }, 'another-key', context), isCode('INVALID_OTP'));
  assert.equal(state.user.status, 'PENDING_VERIFICATION');
});

test('expired OTP cannot be consumed or activate account', async () => {
  const state = otpHarness();
  state.otp.expiresAt = new Date(Date.now() - 1);
  await assert.rejects(state.service.verifyEmail({ email: state.user.email, otp: state.code }, 'test-key', context), isCode('INVALID_OTP'));
  assert.equal(state.otp.verifiedAt, null);
  assert.equal(state.otp.attempts, 0);
});

test('successful OTP is consumed once and activates pending account', async () => {
  const state = otpHarness();
  await state.service.verifyEmail({ email: state.user.email, otp: state.code }, 'test-key', context);
  assert.equal(state.user.status, 'ACTIVE');
  assert.ok(state.otp.verifiedAt);
  await assert.rejects(state.service.verifyEmail({ email: state.user.email, otp: state.code }, 'another-key', context), isCode('INVALID_OTP'));
  assert.equal(state.otp.attempts, 1);
});

test('refresh reuse commits session-family revocation before rejecting the request', async () => {
  let committed = false;
  let sessionsRevoked = false;
  let tokensRevoked = false;
  const actions: string[] = [];
  const token = { userId: 1n, sessionId: 2n, revokedAt: new Date() };
  const tx = {
    $queryRaw: async () => [{ id: 1n }],
    refreshToken: { findUnique: async () => token, updateMany: async () => { tokensRevoked = true; return { count: 1 }; } },
    userSession: { updateMany: async ({ where }: { where: { userId: bigint; id: bigint } }) => {
      assert.deepEqual({ userId: where.userId, id: where.id }, { userId: 1n, id: 2n });
      sessionsRevoked = true; return { count: 1 };
    } },
    auditLog: { create: async ({ data }: { data: { action: string } }) => { actions.push(data.action); return {}; } },
  } as unknown as Prisma.TransactionClient;
  const database = {
    refreshToken: { findUnique: async () => token },
    $transaction: async <T>(action: (transaction: Prisma.TransactionClient) => Promise<T>) => {
      const result = await action(tx); committed = true; return result;
    },
  } as unknown as DatabaseService;
  const service = new AuthService(database, config, {} as IdempotencyService, new RolesService());
  await assert.rejects(service.refresh(opaqueToken('refresh'), context), isCode('UNAUTHORIZED'));
  assert.equal(committed, true);
  assert.equal(sessionsRevoked, true);
  assert.equal(tokensRevoked, true);
  assert.deepEqual(actions, ['REFRESH_TOKEN_REUSE']);
});

test('password reset racing with login prevents creation of a session from an old hash', async () => {
  const password = 'a correct password';
  const hash = await hashPassword(password);
  const user = { id: 1n, passwordHash: hash, status: 'ACTIVE' };
  let committed = false;
  const tx = {
    $queryRaw: async () => [{ id: 1n }],
    user: { findUnique: async () => ({ ...user, passwordHash: 'a-new-password-hash' }) },
    auditLog: { create: async () => ({}) },
  } as unknown as Prisma.TransactionClient;
  const database = {
    user: { findUnique: async () => user },
    $transaction: async <T>(action: (transaction: Prisma.TransactionClient) => Promise<T>) => {
      const result = await action(tx); committed = true; return result;
    },
  } as unknown as DatabaseService;
  const service = new AuthService(database, config, {} as IdempotencyService, new RolesService());
  await assert.rejects(service.login({ email: 'x@example.com', password }, context), isCode('INVALID_CREDENTIALS'));
  assert.equal(committed, true);
});

test('auth guard rejects revoked sessions even when the JWT is cryptographically valid', async () => {
  const claims = { sub: randomUUID(), sid: randomUUID() };
  const token = signAccessToken(claims, { secret: values.jwtAccessSecret, issuer: values.jwtIssuer, audience: values.jwtAudience, ttlSeconds: 900 });
  const database = { userSession: { findUnique: async () => ({ revokedAt: new Date() }) } } as unknown as DatabaseService;
  const guard = new AuthGuard(config, database);
  const execution = { switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: `Bearer ${token}` } }) }) } as unknown as ExecutionContext;
  await assert.rejects(guard.canActivate(execution), isCode('UNAUTHORIZED'));
});
