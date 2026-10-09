import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { AppConfig } from '../../config/app-config';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ApiError } from '../errors/api-error';
import type { ApiRequest } from '../http/request-context';
import { digest } from '../security/crypto';

export const RATE_SCRIPT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('TTL',KEYS[1])}";

export function rateCategory(path: string): 'login' | 'otpSend' | 'otpVerify' | 'forgot' | 'normal' {
  if (path.endsWith('/login')) return 'login';
  if (/\/(signup|resend-verification)$/.test(path)) return 'otpSend';
  if (/\/(verify-email|verify-reset-otp|reset-password)$/.test(path)) return 'otpVerify';
  if (path.endsWith('/forgot-password')) return 'forgot';
  return 'normal';
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService, private readonly config: AppConfig) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ApiRequest>();
    if (!req.path.startsWith('/api/')) return true;
    const res = context.switchToHttp().getResponse<Response>();
    const cfg = this.config.values; const category = rateCategory(req.path);
    const limit = { login: cfg.rateLogin, otpSend: cfg.rateOtpSend, otpVerify: cfg.rateOtpVerify, forgot: cfg.rateForgot, normal: cfg.rateNormal }[category];
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const subjects = [`ip:${ip}`];
    const email: unknown = req.body?.email;
    if (category !== 'normal' && typeof email === 'string') subjects.push(`account:${email.trim().toLowerCase()}`);
    for (const subject of subjects) {
      let result: unknown;
      try { result = await this.redis.client.eval(RATE_SCRIPT, 1, `rate:${category}:${digest(subject, cfg.tokenHashSecret)}`, cfg.rateWindowSeconds); }
      catch { throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again.'); }
      const [count, remaining] = result as [number, number];
      if (count > limit) {
        res.setHeader('Retry-After', Math.max(1, remaining));
        throw new ApiError(429, 'RATE_LIMITED', 'Too many attempts. Please wait before trying again.');
      }
    }
    return true;
  }
}
