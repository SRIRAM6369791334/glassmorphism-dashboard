import { Injectable, Logger } from '@nestjs/common';
import { OutboxEvent, Prisma } from '@prisma/client';
import { UnrecoverableError } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '../../config/app-config';
import { otpCode } from '../../common/security/crypto';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';

export function outboxPayload(value: Prisma.JsonValue): { otpId?: string; requestId?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return {
    otpId: typeof value.otpId === 'string' && /^[0-9a-f-]{36}$/i.test(value.otpId) ? value.otpId : undefined,
    requestId: typeof value.requestId === 'string' && /^[\w-]{1,100}$/.test(value.requestId) ? value.requestId : undefined,
  };
}

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly email: EmailService,
    private readonly config: AppConfig,
  ) {}

  async process(outboxId: string): Promise<void> {
    // Queue payloads are not trusted. Errors stored by BullMQ must be generic.
    if (!/^[1-9][0-9]{0,19}$/.test(outboxId)) throw new UnrecoverableError('INVALID_OUTBOX_ID');
    try {
      await this.processClaim(BigInt(outboxId));
    } catch (error: unknown) {
      if (error instanceof UnrecoverableError) throw new UnrecoverableError('OUTBOX_DELIVERY_FAILED');
      // eslint-disable-next-line preserve-caught-error -- BullMQ persists causes; provider errors may contain credentials.
      throw new Error('OUTBOX_DELIVERY_FAILED');
    }
  }

  private async processClaim(id: bigint): Promise<void> {
    const now = new Date();
    const cfg = this.config.values;
    const lockToken = randomUUID();
    const claimed = await this.database.outboxEvent.updateMany({
      where: {
        id, eventType: { not: 'REQUEST_RECEIPT' }, attempts: { lt: cfg.queueAttempts },
        OR: [
          { status: 'PENDING' },
          { status: 'PROCESSING', lockedAt: { lte: new Date(now.getTime() - cfg.outboxLeaseMs) } },
        ],
      },
      data: { status: 'PROCESSING', lockedAt: now, lockToken, attempts: { increment: 1 } },
    });
    if (claimed.count === 0) return;
    const row = await this.database.outboxEvent.findUniqueOrThrow({ where: { id } });
    const payload = outboxPayload(row.payload);
    let leaseLost = false;
    let renewing = false;
    const heartbeat = setInterval(() => {
      if (renewing) return;
      renewing = true;
      void this.database.outboxEvent.updateMany({
        where: { id, lockToken, status: 'PROCESSING' }, data: { lockedAt: new Date() },
      }).then((result) => { if (result.count === 0) leaseLost = true; })
        .catch(() => { leaseLost = true; })
        .finally(() => { renewing = false; });
    }, Math.max(1_000, Math.floor(cfg.outboxLeaseMs / 3)));
    heartbeat.unref();
    try {
      await this.deliver(row);
      if (leaseLost) throw new Error('OUTBOX_LEASE_LOST');
      const completed = await this.database.outboxEvent.updateMany({
        where: { id, lockToken, status: 'PROCESSING' },
        data: { status: 'COMPLETED', processedAt: new Date(), lockToken: null, lockedAt: null },
      });
      if (completed.count === 0) throw new Error('OUTBOX_LEASE_LOST');
      this.logger.log({ event: 'outbox_completed', outboxId: id.toString(), requestId: payload.requestId,
        attempt: row.attempts, durationMs: Date.now() - now.getTime() });
    } catch (error: unknown) {
      const exhausted = row.attempts >= cfg.queueAttempts || error instanceof UnrecoverableError;
      await this.database.outboxEvent.updateMany({
        where: { id, lockToken, status: 'PROCESSING' },
        data: {
          status: exhausted ? 'FAILED' : 'PENDING', lockToken: null, lockedAt: null,
          availableAt: new Date(Date.now() + cfg.queueBackoffMs * 2 ** Math.min(row.attempts - 1, 16)),
        },
      });
      this.logger.warn({ event: 'outbox_delivery_failed', outboxId: id.toString(), requestId: payload.requestId,
        attempt: row.attempts, exhausted, durationMs: Date.now() - now.getTime() });
      if (exhausted) throw new UnrecoverableError('OUTBOX_DELIVERY_FAILED');
      // eslint-disable-next-line preserve-caught-error -- Never persist a provider error in a queue record.
      throw new Error('OUTBOX_DELIVERY_FAILED');
    } finally {
      clearInterval(heartbeat);
    }
  }

  private async deliver(row: OutboxEvent): Promise<void> {
    if (row.eventType === 'USER_CREATED' || row.eventType === 'PASSWORD_RESET') return;
    if (row.eventType !== 'EMAIL_VERIFICATION_REQUESTED' && row.eventType !== 'PASSWORD_RESET_REQUESTED') {
      throw new UnrecoverableError('OUTBOX_EVENT_UNSUPPORTED');
    }
    const { otpId } = outboxPayload(row.payload);
    if (!otpId) throw new UnrecoverableError('OUTBOX_PAYLOAD_INVALID');
    const otp = await this.database.emailOtp.findUnique({ where: { publicId: otpId }, include: { user: true } });
    // Expired, superseded or used OTP events are complete without delivering a stale code.
    if (!otp || otp.verifiedAt || otp.invalidatedAt || otp.expiresAt <= new Date() ||
      otp.attempts >= this.config.values.otpMaxAttempts || !otp.user.email || otp.user.deletedAt ||
      (otp.user.status !== 'ACTIVE' && otp.user.status !== 'PENDING_VERIFICATION')) return;
    const expectedPurpose = row.eventType === 'EMAIL_VERIFICATION_REQUESTED' ? 'SIGNUP' : 'FORGOT_PASSWORD';
    if (otp.purpose !== expectedPurpose) throw new UnrecoverableError('OUTBOX_PURPOSE_MISMATCH');
    await this.email.sendOtp({
      to: otp.user.email,
      code: otpCode(otp.publicId, this.config.values.otpSecret),
      purpose: expectedPurpose,
      deliveryKey: `outbox-${row.id.toString()}`,
    });
  }
}
