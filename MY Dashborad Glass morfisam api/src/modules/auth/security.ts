import { randomBytes, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';

export const PASSWORD_HASH_OPTIONS = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function validPassword(password: string, minimumLength: number): boolean {
  return password.length >= minimumLength && password.length <= 128;
}

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, PASSWORD_HASH_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function opaqueToken(kind: 'refresh' | 'reset'): string {
  return `${kind === 'refresh' ? 'rft' : 'rst'}_${randomBytes(32).toString('base64url')}`;
}

export function equalDigest(left: string, right: string): boolean {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export interface AccessTokenOptions {
  secret: string;
  issuer: string;
  audience: string;
  ttlSeconds: number;
}

export interface AccessClaims {
  sub: string;
  sid: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function signAccessToken(claims: AccessClaims, options: AccessTokenOptions): string {
  return jwt.sign({ sid: claims.sid }, options.secret, {
    subject: claims.sub,
    algorithm: 'HS256',
    issuer: options.issuer,
    audience: options.audience,
    expiresIn: options.ttlSeconds,
  });
}

export function verifyAccessToken(token: string, options: AccessTokenOptions): AccessClaims {
  const claims = jwt.verify(token, options.secret, {
    algorithms: ['HS256'], issuer: options.issuer, audience: options.audience,
  });
  if (typeof claims === 'string' || typeof claims.sub !== 'string' || typeof claims.sid !== 'string'
    || !UUID.test(claims.sub) || !UUID.test(claims.sid) || typeof claims.exp !== 'number') {
    throw new Error('Invalid access claims.');
  }
  return { sub: claims.sub, sid: claims.sid };
}
