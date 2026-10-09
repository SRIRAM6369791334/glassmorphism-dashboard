import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { digest, otpCode } from '../../src/common/security/crypto';
import { LoginDto, ResetPasswordDto, SignupDto, VerifyOtpDto } from '../../src/modules/auth/auth.dto';
import { equalDigest, hashPassword, opaqueToken, signAccessToken, validPassword, verifyAccessToken, verifyPassword } from '../../src/modules/auth/security';
import { hasEveryPermission } from '../../src/modules/permissions/permissions.service';

const tokenOptions = { secret: 'unit-test-only-access-secret-not-for-real-use', issuer: 'unit-test-api', audience: 'unit-test-web', ttlSeconds: 900 };
const claims = { sub: randomUUID(), sid: randomUUID() };

test('Argon2id uses independent salts and preserves password whitespace', async () => {
  const password = '  twelve characters  ';
  const [first, second] = await Promise.all([hashPassword(password), hashPassword(password)]);
  assert.match(first, /^\$argon2id\$/);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(first, password), true);
  assert.equal(await verifyPassword(first, password.trim()), false);
  assert.equal(await verifyPassword('corrupt hash', password), false);
});

test('configurable password length has a bounded maximum', () => {
  assert.equal(validPassword('a'.repeat(11), 12), false);
  assert.equal(validPassword('a'.repeat(12), 12), true);
  assert.equal(validPassword('a'.repeat(128), 12), true);
  assert.equal(validPassword('a'.repeat(129), 12), false);
});

test('opaque credentials have 256 random bits and distinct token purposes', () => {
  const tokens = Array.from({ length: 50 }, () => opaqueToken('refresh'));
  assert.equal(new Set(tokens).size, 50);
  assert.ok(tokens.every((token) => /^rft_[A-Za-z0-9_-]{43}$/.test(token)));
  assert.match(opaqueToken('reset'), /^rst_[A-Za-z0-9_-]{43}$/);
});

test('OTP derivation is six digits, secret-dependent, and digest comparison is bounded', () => {
  const id = randomUUID();
  const code = otpCode(id, 'unit-test-secret');
  assert.match(code, /^\d{6}$/);
  assert.equal(code, otpCode(id, 'unit-test-secret'));
  assert.notEqual(digest(code, 'one-secret'), digest(code, 'other-secret'));
  assert.equal(equalDigest(digest(code, 'one-secret'), digest(code, 'one-secret')), true);
  assert.equal(equalDigest(digest(code, 'one-secret'), 'a'), false);
  assert.equal(equalDigest('', ''), false);
});

test('access JWT validates identity without embedding account data', () => {
  const token = signAccessToken(claims, tokenOptions);
  assert.deepEqual(verifyAccessToken(token, tokenOptions), claims);
  const decoded = jwt.decode(token) as jwt.JwtPayload;
  assert.deepEqual(Object.keys(decoded).sort(), ['aud', 'exp', 'iat', 'iss', 'sid', 'sub']);
});

test('JWT rejects wrong signature, audience, issuer, algorithm, expiry and missing session', () => {
  const token = signAccessToken(claims, tokenOptions);
  assert.throws(() => verifyAccessToken(token, { ...tokenOptions, secret: 'incorrect' }));
  assert.throws(() => verifyAccessToken(token, { ...tokenOptions, audience: 'another-app' }));
  assert.throws(() => verifyAccessToken(token, { ...tokenOptions, issuer: 'another-issuer' }));
  assert.throws(() => verifyAccessToken(signAccessToken(claims, { ...tokenOptions, ttlSeconds: -1 }), tokenOptions));
  const wrongAlgorithm = jwt.sign(claims, tokenOptions.secret, { algorithm: 'HS384', issuer: tokenOptions.issuer, audience: tokenOptions.audience });
  assert.throws(() => verifyAccessToken(wrongAlgorithm, tokenOptions));
  const missingSession = jwt.sign({ sub: claims.sub }, tokenOptions.secret, { issuer: tokenOptions.issuer, audience: tokenOptions.audience, expiresIn: 30 });
  assert.throws(() => verifyAccessToken(missingSession, tokenOptions));
});

test('RBAC requires every explicit permission and grants no wildcard implicitly', () => {
  assert.equal(hasEveryPermission(['user:read'], ['user:read']), true);
  assert.equal(hasEveryPermission(['user:read'], ['user:read', 'user:update']), false);
  assert.equal(hasEveryPermission(['ADMIN', '*'], ['user:delete']), false);
  assert.equal(hasEveryPermission([], []), true);
});

test('signup normalizes email/name while leaving password exactly as supplied', async () => {
  const dto = plainToInstance(SignupDto, { email: ' User@Example.com ', password: '  correct horse  ', firstName: ' Ada ', phone: '+919876543210' });
  assert.deepEqual(await validate(dto, { whitelist: true, forbidNonWhitelisted: true }), []);
  assert.equal(dto.email, 'user@example.com');
  assert.equal(dto.firstName, 'Ada');
  assert.equal(dto.password, '  correct horse  ');
});

test('DTOs reject malformed email, empty names, phone numbers and unrecognized fields', async () => {
  const dto = plainToInstance(SignupDto, { email: 'invalid', password: 'valid password', firstName: ' ', phone: '555', role: 'ADMIN' });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  assert.deepEqual(errors.map((error) => error.property).sort(), ['email', 'firstName', 'phone', 'role']);
  assert.ok((await validate(plainToInstance(LoginDto, { email: 'x@example.com', password: 'x'.repeat(129) }))).length > 0);
});

test('OTP and reset token DTOs require exact token formats', async () => {
  assert.equal((await validate(plainToInstance(VerifyOtpDto, { email: 'x@example.com', otp: '012345' }))).length, 0);
  assert.ok((await validate(plainToInstance(VerifyOtpDto, { email: 'x@example.com', otp: '12345' }))).length > 0);
  assert.ok((await validate(plainToInstance(ResetPasswordDto, { resetToken: opaqueToken('refresh'), newPassword: 'long enough password' }))).length > 0);
  assert.equal((await validate(plainToInstance(ResetPasswordDto, { resetToken: opaqueToken('reset'), newPassword: 'long enough password' }))).length, 0);
});
