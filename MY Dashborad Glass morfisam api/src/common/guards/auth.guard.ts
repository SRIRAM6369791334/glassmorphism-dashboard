import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppConfig } from '../../config/app-config';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { AccessClaims, verifyAccessToken } from '../../modules/auth/security';
import { ApiError } from '../errors/api-error';
import { ApiRequest } from '../http/request-context';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly config: AppConfig, private readonly database: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.');
    const cfg = this.config.values;
    let claims: AccessClaims;
    try {
      claims = verifyAccessToken(authorization.slice(7), {
        secret: cfg.jwtAccessSecret, issuer: cfg.jwtIssuer, audience: cfg.jwtAudience, ttlSeconds: cfg.accessTokenTtlSeconds,
      });
    } catch {
      throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.');
    }
    const session = await this.database.userSession.findUnique({ where: { publicId: claims.sid }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.publicId !== claims.sub
      || session.user.status !== 'ACTIVE' || session.user.deletedAt || !session.user.emailVerifiedAt) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.');
    }
    request.auth = { userId: session.userId, sessionId: session.id, userPublicId: claims.sub, sessionPublicId: claims.sid };
    return true;
  }
}
