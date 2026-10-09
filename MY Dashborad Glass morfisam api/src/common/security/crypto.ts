import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function digest(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

// Challenge IDs are random UUIDs. A separate server key lets the worker recreate
// a code without storing plaintext/reversible codes in a database or queue.
export function otpCode(challengeId: string, secret: string): string {
  const bytes = createHmac('sha256', secret).update(`email-otp:${challengeId}`).digest();
  return (bytes.readBigUInt64BE() % 1_000_000n).toString().padStart(6, '0');
}

export function constantEqual(a: string, b: string): boolean {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function seal(value: unknown, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

export function unseal<T>(value: string, secret: string): T {
  const input = Buffer.from(value, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), input.subarray(0, 12));
  decipher.setAuthTag(input.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(input.subarray(28)), decipher.final()]).toString('utf8')) as T;
}
