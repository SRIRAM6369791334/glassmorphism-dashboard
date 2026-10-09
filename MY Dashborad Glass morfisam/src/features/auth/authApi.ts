import type { LoginValues, RegisterValues } from './types'

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
}

interface Session {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

const API_BASE = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const REQUEST_TIMEOUT = 15_000
const safeMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  PASSWORD_POLICY: 'Please use a password containing 12–128 characters.',
  EMAIL_NOT_VERIFIED: 'Verify your email before signing in.',
  EMAIL_VERIFICATION_REQUIRED: 'Verify your email before signing in.',
  INVALID_OTP: 'The verification code is invalid or expired. Please try again.',
  OTP_INVALID: 'The verification code is invalid or expired. Please try again.',
  OTP_EXPIRED: 'This verification code has expired. Request a new code.',
  OTP_ATTEMPTS_EXCEEDED: 'Too many attempts. Request a new code and try again later.',
  INVALID_RESET_TOKEN: 'Your password reset has expired. Start password recovery again.',
  RATE_LIMITED: 'Too many requests. Please wait before trying again.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait before trying again.',
  VALIDATION_ERROR: 'Please check your details. Passwords must contain 12–128 characters.',
  VALIDATION_FAILED: 'Please check your details. Passwords must contain 12–128 characters.',
  IDEMPOTENCY_CONFLICT: 'This request is already processing. Wait a moment and try again.',
  IDEMPOTENCY_IN_PROGRESS: 'This request is already processing. Wait a moment and try again.',
  REQUEST_IN_PROGRESS: 'This request is already processing. Wait a moment and try again.',
  IDEMPOTENCY_EXPIRED: 'This retry window has ended. Check your account before trying a new request.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  SESSION_REVOKED: 'Your session has ended. Please sign in again.',
}

export class AuthApiError extends Error {
  constructor(public code: string, public status: number, public uncertain = false) {
    super(uncertain
      ? 'Your connection seems slow or unavailable. The request may have completed. Try again to safely check the same request.'
      : safeMessages[code] ?? (status === 429
        ? safeMessages.RATE_LIMITED
        : 'We could not complete your request. Please try again.'))
  }
}

export function authErrorMessage(error: unknown): string {
  return error instanceof AuthApiError ? error.message : 'We could not complete your request. Please try again.'
}

let session: Session | null = null
let expiresAt = 0
let refreshPromise: Promise<Session | null> | null = null
// Only hashes and random keys are retained; no passwords, OTPs or reset tokens.
const pendingWrites = new Map<string, { fingerprint: string; key: string }>()

async function request<T>(path: string, options: { body?: object; key?: string; token?: string; method?: 'GET' | 'POST' } = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/${path}`, {
      method: options.method ?? 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.key ? { 'Idempotency-Key': options.key } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.method === 'GET' ? {} : { body: JSON.stringify(options.body ?? {}) }),
      signal: controller.signal,
    })
    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok || !payload || typeof payload !== 'object' || !('success' in payload) || payload.success !== true) {
      const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string'
        ? payload.code : 'REQUEST_FAILED'
      throw new AuthApiError(code, response.status, response.status >= 500 || response.status === 408)
    }
    if (!('data' in payload)) throw new AuthApiError('INVALID_RESPONSE', response.status, true)
    return payload.data as T
  } catch (error) {
    if (error instanceof AuthApiError) throw error
    throw new AuthApiError('CONNECTION_UNCERTAIN', 0, true)
  } finally {
    window.clearTimeout(timeout)
  }
}

async function write<T>(path: string, body: object): Promise<T> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)))
  const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  const previous = pendingWrites.get(path)
  const operation = previous?.fingerprint === fingerprint ? previous : { fingerprint, key: crypto.randomUUID() }
  pendingWrites.set(path, operation)
  try {
    const result = await request<T>(path, { body, key: operation.key })
    if (pendingWrites.get(path) === operation) pendingWrites.delete(path)
    return result
  } catch (error) {
    if (error instanceof AuthApiError && !error.uncertain && !['REQUEST_IN_PROGRESS', 'IDEMPOTENCY_IN_PROGRESS', 'IDEMPOTENCY_CONFLICT', 'IDEMPOTENCY_EXPIRED'].includes(error.code)) {
      if (pendingWrites.get(path) === operation) pendingWrites.delete(path)
    }
    throw error
  }
}

function rememberSession(value: Session | null) {
  session = value
  expiresAt = value ? Date.now() + value.expiresIn * 1000 : 0
  return value
}

export function refreshSession(): Promise<Session | null> {
  if (refreshPromise) return refreshPromise
  const refresh = async () => {
    try {
      return rememberSession(await request<Session>('refresh'))
    } catch (error) {
      rememberSession(null)
      if (error instanceof AuthApiError && error.status === 401) return null
      throw error
    }
  }
  // Cookie rotation across tabs is serialized where Web Locks are supported.
  refreshPromise = (navigator.locks ? navigator.locks.request('glass-auth-refresh', refresh) : refresh())
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

export async function restoreSession() {
  return session && Date.now() < expiresAt - 30_000 ? session : refreshSession()
}

export const authApi = {
  async login(values: LoginValues) {
    return rememberSession(await request<Session>('login', { body: values }))!
  },
  signup(values: RegisterValues) {
    const [firstName = '', ...rest] = values.fullName.trim().split(/\s+/)
    return write<{ message: string }>('signup', { email: values.email.trim(), password: values.password, firstName, ...(rest.length ? { lastName: rest.join(' ') } : {}) })
  },
  verifyEmail: (email: string, otp: string) => write<{ message: string }>('verify-email', { email, otp }),
  resendVerification: (email: string) => write<{ message: string }>('resend-verification', { email }),
  forgotPassword: (email: string) => write<{ message: string }>('forgot-password', { email }),
  verifyResetOtp: (email: string, otp: string) => write<{ resetToken: string }>('verify-reset-otp', { email, otp }),
  resetPassword: (resetToken: string, newPassword: string) => write<{ message: string }>('reset-password', { resetToken, newPassword }),
  async me(): Promise<AuthUser | null> {
    let current = await restoreSession()
    if (!current) return null
    try {
      return await request<AuthUser>('me', { method: 'GET', token: current.accessToken })
    } catch (error) {
      if (!(error instanceof AuthApiError) || error.status !== 401) throw error
      current = await refreshSession()
      return current ? request<AuthUser>('me', { method: 'GET', token: current.accessToken }) : null
    }
  },
  async logout(all = false) {
    const current = await restoreSession()
    if (!current) { rememberSession(null); return }
    try {
      await request(all ? 'logout-all' : 'logout', { token: current.accessToken })
    } catch (error) {
      // A server-revoked session is already signed out. Let the UI leave its
      // cached session view; a lost response can be retried with the same action.
      if (!(error instanceof AuthApiError) || error.status !== 401) throw error
    }
    rememberSession(null)
  },
}
