import 'reflect-metadata';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { NestFactory } from '@nestjs/core';
import supertest from 'supertest';
import { SMTPServer } from 'smtp-server';
import { AppModule } from '../../src/app.module';
import { AppConfig } from '../../src/config/app-config';
import { configureApp } from '../../src/common/http/configure-app';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { QueueModule } from '../../src/infrastructure/queue/queue.module';
import { RedisService } from '../../src/infrastructure/redis/redis.service';
import { digest, otpCode } from '../../src/common/security/crypto';

test('real MySQL, Redis, BullMQ and local SMTP authentication contract', { skip: process.env.RUN_INTEGRATION !== '1', timeout: 120_000 }, async (t) => {
  const database = new URL(process.env.DATABASE_URL ?? 'mysql://localhost/missing');
  assert.match(database.pathname, /_test$/, 'Integration checks require a separate database ending in _test');
  process.env.QUEUE_NAME = `glass-test-${randomUUID()}`;
  for (const key of ['RATE_NORMAL', 'RATE_LOGIN', 'RATE_OTP_SEND', 'RATE_OTP_VERIFY', 'RATE_FORGOT']) process.env[key] = '1000';
  process.env.OUTBOX_POLL_MS = '100'; process.env.EMAIL_PROVIDER = 'smtp';
  process.env.SMTP_HOST = '127.0.0.1'; process.env.SMTP_SECURE = 'false';
  const messages: Array<{ recipient: string; code: string }> = [];
  const smtp = new SMTPServer({
    authOptional: true, disabledCommands: ['STARTTLS'],
    onData(stream, session, callback) {
      let content = '';
      stream.on('data', (chunk: Buffer) => { content += chunk.toString(); });
      stream.on('end', () => {
        const code = /verification code is (\d{6})/.exec(content)?.[1];
        if (code) messages.push({ recipient: session.envelope.rcptTo[0].address, code });
        callback();
      });
    },
  });
  await new Promise<void>((resolve) => smtp.listen(0, '127.0.0.1', resolve));
  // smtp-server exposes its underlying net.Server, despite omitting it from its types.
  const smtpAddress = (smtp as unknown as { server: import('node:net').Server }).server.address();
  assert.ok(smtpAddress && typeof smtpAddress === 'object');
  process.env.SMTP_PORT = String(smtpAddress.port);
  t.after(() => new Promise<void>((resolve) => smtp.close(resolve)));
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: false, abortOnError: false });
  configureApp(app); await app.init(); t.after(() => app.close());
  const worker = await NestFactory.createApplicationContext(QueueModule, { logger: false, abortOnError: false });
  t.after(() => worker.close());
  const http = supertest(app.getHttpServer()); const db = app.get(DatabaseService); const cfg = app.get(AppConfig).values;
  const origin = cfg.corsOrigins[0]; const email = `auth-${randomUUID()}@example.test`; const password = '  Correct horse battery  ';
  const body = { email, password, firstName: 'Test', lastName: 'Account' };
  const post = (path: string, payload: object = {}, key = randomUUID()) => http.post(`/api/v1/auth/${path}`).set('Origin', origin).set('Idempotency-Key', key).send(payload);
  const cookie = (response: supertest.Response) => {
    const header = response.headers['set-cookie']; const value = Array.isArray(header) ? header[0] : String(header);
    assert.match(value, /HttpOnly/); assert.match(value, /SameSite=Strict/); return value.split(';')[0];
  };
  const login = () => post('login', { email, password });
  const storedOtp = async (purpose: 'SIGNUP' | 'FORGOT_PASSWORD') => {
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    return db.emailOtp.findFirstOrThrow({ where: { userId: user.id, purpose }, orderBy: { id: 'desc' } });
  };
  await t.test('health, validation, origin and anonymous access boundaries', async () => {
    await http.get('/health/live').expect(200); await http.get('/health/ready').expect(200);
    await http.get('/api/v1/auth/me').expect(401);
    await post('signup', { ...body, role: 'ADMIN' }).expect(400);
    await http.post('/api/v1/auth/signup').send(body).expect(400);
    await http.post('/api/v1/auth/login').set('Origin', 'https://untrusted.invalid').send(body).expect(403);
    const malformed = await http.post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{bad').expect(400);
    assert.equal(malformed.body.success, false); assert.ok(malformed.body.requestId);
  });
  await t.test('signup retries commit one account, profile, OTP and receipt', async () => {
    const key = randomUUID(); await post('signup', body, key).expect(201); await post('signup', body, key).expect(201);
    await post('signup', { ...body, firstName: 'Changed' }, key).expect(409);
    await post('signup', body).expect(201);
    assert.equal(await db.user.count({ where: { email } }), 1);
    const user = await db.user.findUniqueOrThrow({ where: { email }, include: { profile: true, emailOtps: true } });
    assert.ok(user.profile); assert.equal(user.emailOtps.length, 1); assert.match(user.passwordHash, /^\$argon2id\$/);
    const receipt = await db.outboxEvent.findUniqueOrThrow({ where: { dedupeKey: `request-${digest(`auth.signup:${key}`, cfg.receiptSecret)}` } });
    assert.ok(!JSON.stringify(receipt.payload).includes(password));
    await login().expect(401);
  });
  await t.test('worker sends local email from committed outbox without queued plaintext codes', async () => {
    const deadline = Date.now() + 20_000;
    while (!messages.some((message) => message.recipient === email) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
    const message = messages.find((entry) => entry.recipient === email); assert.ok(message, 'Local SMTP must receive signup OTP');
    const otp = await storedOtp('SIGNUP'); assert.equal(message.code, otpCode(otp.publicId, cfg.otpSecret));
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const rows = await db.outboxEvent.findMany({ where: { aggregateId: user.publicId } });
    assert.ok(rows.every((row) => !JSON.stringify(row.payload).includes(message.code)));
  });
  await t.test('wrong/expired OTP rejected; valid code consumed once under concurrent verification', async () => {
    const otp = await storedOtp('SIGNUP'); const correct = otpCode(otp.publicId, cfg.otpSecret);
    const wrong = correct === '000000' ? '111111' : '000000';
    const key = randomUUID(); await post('verify-email', { email, otp: wrong }, key).expect(400); await post('verify-email', { email, otp: wrong }, key).expect(400);
    assert.equal((await storedOtp('SIGNUP')).attempts, 1, 'Same failed retry must not double-count attempts');
    await db.emailOtp.update({ where: { id: otp.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await post('verify-email', { email, otp: correct }).expect(400);
    await db.emailOtp.update({ where: { id: otp.id }, data: { expiresAt: new Date(Date.now() + 300_000) } });
    const responses = await Promise.all([post('verify-email', { email, otp: correct }), post('verify-email', { email, otp: correct })]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400]);
  });
  let firstAccess = ''; let rotatedAccess = ''; let secondAccess = ''; let firstCookie = ''; let secondCookie = '';
  await t.test('login, refresh rotation and reuse revoke only affected session family', async () => {
    const failed = await post('login', { email, password: 'wrong' }).expect(401); assert.equal(failed.body.code, 'INVALID_CREDENTIALS');
    const first = await login().expect(200); firstAccess = first.body.data.accessToken; firstCookie = cookie(first);
    const second = await login().expect(200); secondAccess = second.body.data.accessToken; secondCookie = cookie(second);
    await http.get('/api/v1/auth/me').set('Authorization', `Bearer ${firstAccess}`).expect(200);
    const rotated = await post('refresh').set('Cookie', firstCookie).expect(200); rotatedAccess = rotated.body.data.accessToken;
    assert.notEqual(cookie(rotated), firstCookie);
    await post('refresh').set('Cookie', firstCookie).expect(401);
    await http.get('/api/v1/auth/me').set('Authorization', `Bearer ${rotatedAccess}`).expect(401);
    await http.get('/api/v1/auth/me').set('Authorization', `Bearer ${secondAccess}`).expect(200);
  });
  await t.test('logout and logout-all enforce immediate revocation', async () => {
    const third = await login().expect(200);
    await post('logout').set('Authorization', `Bearer ${secondAccess}`).set('Cookie', secondCookie).expect(200);
    await http.get('/api/v1/auth/me').set('Authorization', `Bearer ${secondAccess}`).expect(401);
    await http.get('/api/v1/auth/me').set('Authorization', `Bearer ${third.body.data.accessToken}`).expect(200);
    const fourth = await login().expect(200);
    await post('logout-all').set('Authorization', `Bearer ${third.body.data.accessToken}`).expect(200);
    await http.get('/api/v1/auth/me').set('Authorization', `Bearer ${fourth.body.data.accessToken}`).expect(401);
  });
  await t.test('generic recovery, cooldown, OTP brute force, single-use reset and session revocation', async () => {
    const existing = await post('forgot-password', { email }).expect(200);
    const missing = await post('forgot-password', { email: `missing-${randomUUID()}@example.test` }).expect(200);
    assert.deepEqual(existing.body.data, missing.body.data);
    const otp = await storedOtp('FORGOT_PASSWORD'); const code = otpCode(otp.publicId, cfg.otpSecret);
    await post('forgot-password', { email }).expect(200); assert.equal((await storedOtp('FORGOT_PASSWORD')).id, otp.id);
    for (let i = 0; i < cfg.otpMaxAttempts; i++) await post('verify-reset-otp', { email, otp: code === '000000' ? '111111' : '000000' }).expect(400);
    await post('verify-reset-otp', { email, otp: code }).expect(400);
    await db.emailOtp.update({ where: { id: otp.id }, data: { createdAt: new Date(Date.now() - 61_000) } });
    await post('forgot-password', { email }).expect(200);
    const latest = await storedOtp('FORGOT_PASSWORD'); assert.notEqual(latest.id, otp.id);
    const payload = { email, otp: otpCode(latest.publicId, cfg.otpSecret) }; const key = randomUUID();
    const verified = await post('verify-reset-otp', payload, key).expect(200);
    const replay = await post('verify-reset-otp', payload, key).expect(200); assert.equal(replay.body.data.resetToken, verified.body.data.resetToken);
    await post('verify-reset-otp', payload).expect(400);
    const signedIn = await login().expect(200); const reset = { resetToken: verified.body.data.resetToken as string, newPassword: '  new long password  ' };
    const resetKey = randomUUID(); await post('reset-password', reset, resetKey).expect(200); await post('reset-password', reset, resetKey).expect(200);
    await post('reset-password', reset).expect(400);
    await http.get('/api/v1/auth/me').set('Authorization', `Bearer ${signedIn.body.data.accessToken}`).expect(401);
    await login().expect(401); await post('login', { email, password: reset.newPassword }).expect(200);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    const logs = await db.auditLog.findMany({ where: { userId: user.id } });
    assert.ok(logs.some((log) => log.action === 'PASSWORD_RESET'));
    assert.ok(logs.every((log) => !JSON.stringify(log.metadata).includes(reset.resetToken)));
  });
  await t.test('distributed limits fail closed and health/metrics respond safely', async () => {
    cfg.rateLogin = 1;
    const response = await login().expect(429); assert.ok(response.headers['retry-after']);
    await http.get('/metrics').expect(200);
    const redis = app.get(RedisService).client;
    assert.equal(await redis.ping(), 'PONG');
  });
});
