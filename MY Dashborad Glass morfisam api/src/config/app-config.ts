import { Global, Injectable, Module } from '@nestjs/common';
import 'dotenv/config';

export function readConfig(env: NodeJS.ProcessEnv) {
  const production = env.NODE_ENV === 'production';
  function integer(name: string, fallback: number, min = 1, max = 1_000_000) {
    const value = Number(env[name] ?? fallback);
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid configuration: ${name}`);
    return value;
  }
  function required(name: string) {
    const value = env[name];
    if (!value || value.startsWith('replace-')) throw new Error(`Missing configuration: ${name}`);
    return value;
  }
  function secret(name: string) {
    const value = required(name);
    if (value.length < 32) throw new Error(`Configuration ${name} must contain at least 32 characters`);
    return value;
  }
  function url(value: string, name: string) {
    try { return new URL(value); }
    catch { throw new Error(`Invalid configuration: ${name}`); }
  }
  const databaseUrl = required('DATABASE_URL');
  const dbUrl = url(databaseUrl, 'DATABASE_URL');
  if (dbUrl.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql');
  dbUrl.searchParams.set('connection_limit', String(integer('DB_POOL_SIZE', 10, 1, 100)));
  dbUrl.searchParams.set('pool_timeout', String(integer('DB_POOL_TIMEOUT_SECONDS', 10, 1, 60)));
  const redisUrl = required('REDIS_URL');
  if (!['redis:', 'rediss:'].includes(url(redisUrl, 'REDIS_URL').protocol)) throw new Error('REDIS_URL must use redis or rediss');
  const corsOrigins = (env.CORS_ORIGINS ?? 'http://127.0.0.1:5173,http://localhost:5173').split(',').map((v) => v.trim());
  for (const origin of corsOrigins) {
    const parsed = url(origin, 'CORS_ORIGINS');
    if (origin !== parsed.origin || (production && parsed.protocol !== 'https:')) throw new Error('CORS_ORIGINS requires exact origins and production HTTPS');
  }
  const jwtAccessSecret = secret('JWT_ACCESS_SECRET');
  const tokenHashSecret = secret('TOKEN_HASH_SECRET');
  const otpSecret = secret('OTP_SECRET');
  const receiptSecret = secret('RECEIPT_SECRET');
  if (new Set([jwtAccessSecret, tokenHashSecret, otpSecret, receiptSecret]).size !== 4) throw new Error('Use independent authentication secrets');
  if (!['smtp', 'resend'].includes(env.EMAIL_PROVIDER ?? 'smtp')) throw new Error('Invalid EMAIL_PROVIDER');
  if (integer('OUTBOX_LEASE_MS', 120_000, 30_000, 600_000) < integer('EMAIL_TIMEOUT_MS', 10_000, 1000, 30_000) * 3) throw new Error('OUTBOX_LEASE_MS must cover three email timeouts');
  return {
    production, nodeEnv: env.NODE_ENV ?? 'development', port: integer('PORT', 3000, 1, 65535),
    host: env.HOST ?? '127.0.0.1', databaseUrl: dbUrl.toString(), redisUrl,
    corsOrigins, jwtAccessSecret, tokenHashSecret, otpSecret, receiptSecret,
    jwtIssuer: env.JWT_ISSUER ?? 'glass-auth-api', jwtAudience: env.JWT_AUDIENCE ?? 'glass-auth-web',
    accessTokenTtlSeconds: integer('ACCESS_TOKEN_TTL_SECONDS', 900, 60, 3600),
    refreshTokenTtlSeconds: integer('REFRESH_TOKEN_TTL_SECONDS', 2_592_000, 300, 7_776_000),
    resetTokenTtlSeconds: integer('RESET_TOKEN_TTL_SECONDS', 600, 60, 1800),
    otpTtlSeconds: integer('OTP_TTL_SECONDS', 300, 60, 600),
    otpMaxAttempts: integer('OTP_MAX_ATTEMPTS', 5, 1, 10), otpCooldownSeconds: integer('OTP_COOLDOWN_SECONDS', 60, 30, 600),
    passwordMinLength: integer('PASSWORD_MIN_LENGTH', 12, 8, 128),
    rateWindowSeconds: integer('RATE_WINDOW_SECONDS', 60, 1, 3600),
    rateNormal: integer('RATE_NORMAL', 120), rateLogin: integer('RATE_LOGIN', 10),
    rateOtpSend: integer('RATE_OTP_SEND', 5), rateOtpVerify: integer('RATE_OTP_VERIFY', 10),
    rateForgot: integer('RATE_FORGOT', 5),
    idempotencyTtlSeconds: integer('IDEMPOTENCY_TTL_SECONDS', 86400, 600, 604800),
    smtpHost: env.SMTP_HOST ?? '127.0.0.1', smtpPort: integer('SMTP_PORT', 1025, 1, 65535),
    smtpSecure: env.SMTP_SECURE === 'true', smtpUser: env.SMTP_USER, smtpPassword: env.SMTP_PASSWORD,
    smtpFrom: env.SMTP_FROM ?? 'Glass Auth <no-reply@localhost>',
    emailProvider: (env.EMAIL_PROVIDER ?? 'smtp') as 'smtp' | 'resend', resendApiKey: env.RESEND_API_KEY,
    emailTimeoutMs: integer('EMAIL_TIMEOUT_MS', 10000, 1000, 30000),
    queueName: env.QUEUE_NAME ?? 'glass-auth-email', queueAttempts: integer('QUEUE_ATTEMPTS', 5, 1, 20),
    queueBackoffMs: integer('QUEUE_BACKOFF_MS', 1000, 100, 60_000), workerConcurrency: integer('WORKER_CONCURRENCY', 5, 1, 100),
    outboxPollMs: integer('OUTBOX_POLL_MS', 1000, 100, 60_000), outboxLeaseMs: integer('OUTBOX_LEASE_MS', 120_000, 30_000, 600_000),
    outboxBatchSize: integer('OUTBOX_BATCH_SIZE', 50, 1, 500),
    metricsToken: production ? secret('METRICS_TOKEN') : (env.METRICS_TOKEN ?? ''),
    trustProxy: env.TRUST_PROXY?.split(',').map((value) => value.trim()).filter(Boolean) ?? [],
  };
}

@Injectable()
export class AppConfig { readonly values = readConfig(process.env); }

@Global()
@Module({ providers: [AppConfig], exports: [AppConfig] })
export class AppConfigModule {}
