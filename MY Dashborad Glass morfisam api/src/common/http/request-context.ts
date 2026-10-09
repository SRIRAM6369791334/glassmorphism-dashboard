import type { Request } from 'express';

export interface AuthContext {
  userId: bigint; sessionId: bigint; userPublicId: string; sessionPublicId: string;
}
export interface ApiRequest extends Request { requestId: string; auth?: AuthContext }
