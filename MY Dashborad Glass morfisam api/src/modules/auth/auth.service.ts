import { Injectable } from '@nestjs/common';
import { OtpPurpose, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '../../config/app-config';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { ApiError } from '../../common/errors/api-error';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';
import { digest, otpCode } from '../../common/security/crypto';
import { RolesService } from '../roles/roles.service';
import { PublicUser, publicUserInclude, toPublicUser } from '../users/users.service';
import { EmailDto, LoginDto, ResetPasswordDto, SignupDto, VerifyOtpDto } from './auth.dto';
import { equalDigest, hashPassword, opaqueToken, signAccessToken, validPassword, verifyPassword } from './security';

export interface AuthContext { requestId: string; ipAddress?: string; userAgent?: string }
export interface AuthIdentity { userId: bigint; sessionId: bigint; userPublicId: string; sessionPublicId: string }
export interface AuthData { accessToken: string; expiresIn: number; user: PublicUser }
export interface SessionResult { data: AuthData; refreshToken: string }
interface Message { message: string }
type Outcome<T> = { ok: true; value: T } | { ok: false; code: 'INVALID_OTP' | 'INVALID_RESET_TOKEN' | 'UNAUTHORIZED' | 'INVALID_CREDENTIALS' };

const SIGNUP_MESSAGE = 'If this address is eligible, a verification code has been sent.';
const RECOVERY_MESSAGE = 'If an account exists, a verification code has been sent.';
const transactionOptions = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted };

@Injectable()
export class AuthService {
  private readonly dummyPasswordHash = hashPassword(`unusable-${randomUUID()}`);

  constructor(
    private readonly database: DatabaseService,
    private readonly config: AppConfig,
    private readonly idempotency: IdempotencyService,
    private readonly roles: RolesService,
  ) {}

  async signup(dto: SignupDto, key: string | undefined, context: AuthContext): Promise<Message> {
    this.checkPassword(dto.password);
    const passwordHash = await hashPassword(dto.password);
    return this.idempotency.run('auth.signup', key, dto, async (tx) => {
      const existing = await tx.user.findFirst({
        where: { OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] }, select: { id: true },
      });
      if (existing) return { message: SIGNUP_MESSAGE };
      // A unique constraint remains authoritative when two distinct keys race.
      let user;
      try {
        user = await tx.user.create({ data: {
          publicId: randomUUID(), email: dto.email, phone: dto.phone, passwordHash,
          profile: { create: {
            firstName: dto.firstName, lastName: dto.lastName,
            displayName: [dto.firstName, dto.lastName].filter(Boolean).join(' ').slice(0, 200),
          } },
        } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { message: SIGNUP_MESSAGE };
        throw error;
      }
      await this.roles.assignDefaultRole(tx, user.id);
      await this.issueOtp(tx, user.id, user.publicId, OtpPurpose.SIGNUP, context);
      await this.audit(tx, user.id, 'USER_CREATED', context);
      await this.domainEvent(tx, user.publicId, 'USER_CREATED', context);
      return { message: SIGNUP_MESSAGE };
    });
  }

  async verifyEmail(dto: VerifyOtpDto, key: string | undefined, context: AuthContext): Promise<Message> {
    const result = await this.idempotency.run<Outcome<Message>>('auth.verify-email', key, dto, async (tx) => {
      const user = await this.lockByEmail(tx, dto.email);
      if (!user || user.status !== 'PENDING_VERIFICATION' || user.deletedAt) return { ok: false, code: 'INVALID_OTP' };
      if (!(await this.consumeOtp(tx, user.id, OtpPurpose.SIGNUP, dto.otp))) return { ok: false, code: 'INVALID_OTP' };
      await tx.user.update({ where: { id: user.id }, data: { status: 'ACTIVE', emailVerifiedAt: new Date() } });
      await this.audit(tx, user.id, 'EMAIL_VERIFIED', context);
      return { ok: true, value: { message: 'Email verified. You can now sign in.' } };
    });
    return this.unwrap(result);
  }

  resendVerification(dto: EmailDto, key: string | undefined, context: AuthContext): Promise<Message> {
    return this.idempotency.run('auth.resend-verification', key, dto, async (tx) => {
      const user = await this.lockByEmail(tx, dto.email);
      if (user?.status === 'PENDING_VERIFICATION' && !user.deletedAt) {
        await this.issueOtp(tx, user.id, user.publicId, OtpPurpose.SIGNUP, context);
      }
      return { message: SIGNUP_MESSAGE };
    });
  }

  forgotPassword(dto: EmailDto, key: string | undefined, context: AuthContext): Promise<Message> {
    return this.idempotency.run('auth.forgot-password', key, dto, async (tx) => {
      const user = await this.lockByEmail(tx, dto.email);
      if (user?.status === 'ACTIVE' && user.emailVerifiedAt && !user.deletedAt) {
        await this.issueOtp(tx, user.id, user.publicId, OtpPurpose.FORGOT_PASSWORD, context);
      }
      return { message: RECOVERY_MESSAGE };
    });
  }

  async verifyResetOtp(dto: VerifyOtpDto, key: string | undefined, context: AuthContext): Promise<{ resetToken: string; expiresIn: number }> {
    const result = await this.idempotency.run<Outcome<{ resetToken: string; expiresIn: number }>>('auth.verify-reset-otp', key, dto, async (tx) => {
      const user = await this.lockByEmail(tx, dto.email);
      if (!user || user.status !== 'ACTIVE' || user.deletedAt) return { ok: false, code: 'INVALID_OTP' };
      if (!(await this.consumeOtp(tx, user.id, OtpPurpose.FORGOT_PASSWORD, dto.otp))) return { ok: false, code: 'INVALID_OTP' };
      const now = new Date();
      await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: now } });
      const resetToken = opaqueToken('reset');
      const expiresIn = this.config.values.resetTokenTtlSeconds;
      await tx.passwordResetToken.create({ data: {
        userId: user.id, tokenHash: digest(resetToken, this.config.values.tokenHashSecret), expiresAt: new Date(now.getTime() + expiresIn * 1000),
      } });
      await this.audit(tx, user.id, 'PASSWORD_RESET_VERIFIED', context);
      return { ok: true, value: { resetToken, expiresIn } };
    });
    return this.unwrap(result);
  }

  async resetPassword(dto: ResetPasswordDto, key: string | undefined, context: AuthContext): Promise<Message> {
    this.checkPassword(dto.newPassword);
    const passwordHash = await hashPassword(dto.newPassword);
    const tokenHash = digest(dto.resetToken, this.config.values.tokenHashSecret);
    const result = await this.idempotency.run<Outcome<Message>>('auth.reset-password', key, dto, async (tx) => {
      const candidate = await tx.passwordResetToken.findUnique({ where: { tokenHash }, select: { userId: true } });
      if (!candidate) return { ok: false, code: 'INVALID_RESET_TOKEN' };
      await this.lockUser(tx, candidate.userId);
      const token = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
      const now = new Date();
      if (!token || token.usedAt || token.expiresAt <= now || token.user.status !== 'ACTIVE' || token.user.deletedAt) {
        return { ok: false, code: 'INVALID_RESET_TOKEN' };
      }
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: token.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now },
      });
      if (consumed.count !== 1) return { ok: false, code: 'INVALID_RESET_TOKEN' };
      await tx.user.update({ where: { id: token.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({ where: { userId: token.userId, usedAt: null }, data: { usedAt: now } });
      await tx.emailOtp.updateMany({ where: { userId: token.userId, purpose: 'FORGOT_PASSWORD', invalidatedAt: null }, data: { invalidatedAt: now } });
      await this.revokeSessions(tx, token.userId, now);
      await this.audit(tx, token.userId, 'PASSWORD_RESET', context);
      await this.domainEvent(tx, token.user.publicId, 'PASSWORD_RESET', context);
      return { ok: true, value: { message: 'Password updated. Please sign in with your new password.' } };
    });
    return this.unwrap(result);
  }

  async login(dto: LoginDto, context: AuthContext): Promise<SessionResult> {
    const candidate = await this.database.user.findUnique({ where: { email: dto.email } });
    // Unknown accounts still pay the same password-hash verification cost.
    const valid = await verifyPassword(candidate?.passwordHash ?? await this.dummyPasswordHash, dto.password);
    if (!candidate || !valid) {
      await this.audit(this.database, candidate?.id, 'LOGIN_FAILED', context);
      return this.unwrap({ ok: false, code: 'INVALID_CREDENTIALS' });
    }
    const result = await this.database.$transaction<Outcome<SessionResult>>(async (tx) => {
      await this.lockUser(tx, candidate.id);
      const user = await tx.user.findUnique({ where: { id: candidate.id }, include: publicUserInclude });
      // A concurrent password reset cannot authenticate an earlier verified hash.
      if (!user || user.passwordHash !== candidate.passwordHash || user.status !== 'ACTIVE' || user.deletedAt || !user.emailVerifiedAt) {
        await this.audit(tx, candidate.id, 'LOGIN_FAILED', context);
        return { ok: false, code: 'INVALID_CREDENTIALS' };
      }
      const expiresAt = new Date(Date.now() + this.config.values.refreshTokenTtlSeconds * 1000);
      const session = await tx.userSession.create({ data: {
        publicId: randomUUID(), userId: user.id, expiresAt,
        ipAddress: context.ipAddress?.slice(0, 45), userAgent: context.userAgent?.slice(0, 512),
      } });
      const refreshToken = await this.newRefreshToken(tx, user.id, session.id, expiresAt);
      await tx.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await this.audit(tx, user.id, 'LOGIN_SUCCEEDED', context);
      return { ok: true, value: { data: this.accessData(toPublicUser(user), session.publicId), refreshToken } };
    }, transactionOptions);
    return this.unwrap(result);
  }

  async refresh(rawToken: string | undefined, context: AuthContext): Promise<SessionResult> {
    if (!rawToken || !/^rft_[A-Za-z0-9_-]{43}$/.test(rawToken)) return this.unwrap({ ok: false, code: 'UNAUTHORIZED' });
    const tokenHash = digest(rawToken, this.config.values.tokenHashSecret);
    const candidate = await this.database.refreshToken.findUnique({ where: { tokenHash }, select: { userId: true } });
    if (!candidate) return this.unwrap({ ok: false, code: 'UNAUTHORIZED' });
    const result = await this.database.$transaction<Outcome<SessionResult>>(async (tx) => {
      await this.lockUser(tx, candidate.userId);
      const token = await tx.refreshToken.findUnique({ where: { tokenHash }, include: { user: { include: publicUserInclude }, session: true } });
      const now = new Date();
      if (!token) return { ok: false, code: 'UNAUTHORIZED' };
      if (token.revokedAt) {
        // Return failure from the transaction: throwing here would roll back revocation.
        await this.revokeSessions(tx, token.userId, now, token.sessionId);
        await this.audit(tx, token.userId, 'REFRESH_TOKEN_REUSE', context);
        return { ok: false, code: 'UNAUTHORIZED' };
      }
      if (token.expiresAt <= now || token.session.expiresAt <= now || token.session.revokedAt || token.user.status !== 'ACTIVE' || token.user.deletedAt) {
        await this.revokeSessions(tx, token.userId, now, token.sessionId);
        return { ok: false, code: 'UNAUTHORIZED' };
      }
      const consumed = await tx.refreshToken.updateMany({ where: { id: token.id, revokedAt: null }, data: { revokedAt: now } });
      if (consumed.count !== 1) return { ok: false, code: 'UNAUTHORIZED' };
      const refreshToken = await this.newRefreshToken(tx, token.userId, token.sessionId, token.session.expiresAt);
      await tx.userSession.update({ where: { id: token.sessionId }, data: { lastActiveAt: now } });
      return { ok: true, value: { data: this.accessData(toPublicUser(token.user), token.session.publicId), refreshToken } };
    }, transactionOptions);
    return this.unwrap(result);
  }

  async logout(identity: AuthIdentity, context: AuthContext, allSessions = false): Promise<Message> {
    await this.database.$transaction(async (tx) => {
      await this.lockUser(tx, identity.userId);
      await this.revokeSessions(tx, identity.userId, new Date(), allSessions ? undefined : identity.sessionId);
      await this.audit(tx, identity.userId, allSessions ? 'LOGOUT_ALL' : 'LOGOUT', context);
    }, transactionOptions);
    return { message: 'Signed out.' };
  }

  private async lockByEmail(tx: Prisma.TransactionClient, email: string) {
    await tx.$queryRaw`SELECT id FROM users WHERE email = ${email} FOR UPDATE`;
    return tx.user.findUnique({ where: { email } });
  }

  private async lockUser(tx: Prisma.TransactionClient, userId: bigint): Promise<void> {
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
  }

  private async issueOtp(tx: Prisma.TransactionClient, userId: bigint, userPublicId: string, purpose: OtpPurpose, context: AuthContext): Promise<void> {
    const now = new Date();
    const latest = await tx.emailOtp.findFirst({ where: { userId, purpose }, orderBy: { createdAt: 'desc' } });
    // Durable cooldown remains effective if Redis is flushed or a request changes IP.
    if (latest && now.getTime() - latest.createdAt.getTime() < this.config.values.otpCooldownSeconds * 1000) return;
    await tx.emailOtp.updateMany({ where: { userId, purpose, verifiedAt: null, invalidatedAt: null }, data: { invalidatedAt: now } });
    const publicId = randomUUID();
    const code = otpCode(publicId, this.config.values.otpSecret);
    await tx.emailOtp.create({ data: {
      publicId, userId, purpose, otpHash: digest(`${publicId}:${code}`, this.config.values.otpSecret),
      expiresAt: new Date(now.getTime() + this.config.values.otpTtlSeconds * 1000),
    } });
    await tx.outboxEvent.create({ data: {
      eventType: purpose === OtpPurpose.SIGNUP ? 'EMAIL_VERIFICATION_REQUESTED' : 'PASSWORD_RESET_REQUESTED',
      aggregateType: 'User', aggregateId: userPublicId, payload: { otpId: publicId, requestId: context.requestId },
    } });
    await this.audit(tx, userId, purpose === OtpPurpose.SIGNUP ? 'SIGNUP_OTP_REQUESTED' : 'RESET_OTP_REQUESTED', context);
  }

  private async consumeOtp(tx: Prisma.TransactionClient, userId: bigint, purpose: OtpPurpose, code: string): Promise<boolean> {
    const now = new Date();
    const otp = await tx.emailOtp.findFirst({
      where: { userId, purpose, verifiedAt: null, invalidatedAt: null }, orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt <= now || otp.attempts >= this.config.values.otpMaxAttempts) return false;
    const valid = equalDigest(otp.otpHash, digest(`${otp.publicId}:${code}`, this.config.values.otpSecret));
    const changed = await tx.emailOtp.updateMany({
      where: { id: otp.id, verifiedAt: null, invalidatedAt: null, attempts: { lt: this.config.values.otpMaxAttempts }, expiresAt: { gt: now } },
      data: {
        attempts: { increment: 1 },
        ...(valid ? { verifiedAt: now } : otp.attempts + 1 >= this.config.values.otpMaxAttempts ? { invalidatedAt: now } : {}),
      },
    });
    return valid && changed.count === 1;
  }

  private async newRefreshToken(tx: Prisma.TransactionClient, userId: bigint, sessionId: bigint, expiresAt: Date): Promise<string> {
    const token = opaqueToken('refresh');
    await tx.refreshToken.create({ data: { userId, sessionId, expiresAt, tokenHash: digest(token, this.config.values.tokenHashSecret) } });
    return token;
  }

  private async revokeSessions(tx: Prisma.TransactionClient, userId: bigint, now: Date, sessionId?: bigint): Promise<void> {
    await tx.userSession.updateMany({ where: { userId, ...(sessionId === undefined ? {} : { id: sessionId }), revokedAt: null }, data: { revokedAt: now } });
    await tx.refreshToken.updateMany({ where: { userId, ...(sessionId === undefined ? {} : { sessionId }), revokedAt: null }, data: { revokedAt: now } });
  }

  private accessData(user: PublicUser, sessionPublicId: string): AuthData {
    const cfg = this.config.values;
    return {
      accessToken: signAccessToken({ sub: user.id, sid: sessionPublicId }, {
        secret: cfg.jwtAccessSecret, issuer: cfg.jwtIssuer, audience: cfg.jwtAudience, ttlSeconds: cfg.accessTokenTtlSeconds,
      }),
      expiresIn: cfg.accessTokenTtlSeconds, user,
    };
  }

  private checkPassword(password: string): void {
    if (!validPassword(password, this.config.values.passwordMinLength)) {
      throw new ApiError(400, 'PASSWORD_POLICY', `Password must contain ${this.config.values.passwordMinLength} to 128 characters.`);
    }
  }

  private audit(tx: Prisma.TransactionClient, userId: bigint | undefined, action: string, context: AuthContext) {
    return tx.auditLog.create({ data: {
      userId, action, resourceType: 'User', ipAddress: context.ipAddress?.slice(0, 45),
      userAgent: context.userAgent?.slice(0, 512), metadata: { requestId: context.requestId },
    } });
  }

  private domainEvent(tx: Prisma.TransactionClient, userPublicId: string, eventType: string, context: AuthContext) {
    return tx.outboxEvent.create({ data: { eventType, aggregateType: 'User', aggregateId: userPublicId, payload: { requestId: context.requestId } } });
  }

  private unwrap<T>(result: Outcome<T>): T {
    if (result.ok) return result.value;
    const messages = {
      INVALID_OTP: 'The code is invalid or expired. Request a new code and try again.',
      INVALID_RESET_TOKEN: 'The password reset has expired. Request a new verification code.',
      INVALID_CREDENTIALS: 'Invalid credentials.',
      UNAUTHORIZED: 'Please sign in again.',
    };
    throw new ApiError(result.code === 'INVALID_OTP' || result.code === 'INVALID_RESET_TOKEN' ? 400 : 401, result.code, messages[result.code]);
  }
}
