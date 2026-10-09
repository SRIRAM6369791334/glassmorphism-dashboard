import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { ApiError } from '../errors/api-error';
import type { ApiRequest } from './request-context';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<ApiRequest>();
    let status = 500; let code = 'INTERNAL_ERROR'; let message = 'The request could not be completed. Please try again.';
    if (error && typeof error === 'object' && 'type' in error && (error.type === 'entity.parse.failed' || error.type === 'entity.too.large')) {
      status = error.type === 'entity.too.large' ? 413 : 400;
      code = status === 413 ? 'PAYLOAD_TOO_LARGE' : 'VALIDATION_ERROR'; message = 'Please check the submitted JSON body.';
    } else if (error instanceof ApiError) {
      status = error.getStatus();
      ({ code, message } = error.getResponse() as { code: string; message: string });
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      code = ({ 400: 'VALIDATION_ERROR', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 413: 'PAYLOAD_TOO_LARGE', 503: 'SERVICE_UNAVAILABLE' } as Record<number, string>)[status] ?? 'REQUEST_REJECTED';
      message = status === 400 ? 'Please check the submitted fields.' : 'The request could not be completed.';
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && ['P1001', 'P1002', 'P2024', 'P2034'].includes(error.code)) {
      status = 503; code = 'SERVICE_UNAVAILABLE'; message = 'Please try again with the same request key.';
    }
    // Never include exceptions, body, cookies, query strings or authorization headers.
    if (status >= 500) process.stderr.write(JSON.stringify({ event: 'request_failed', requestId: request.requestId, status, code }) + '\n');
    response.status(status).json({ success: false, code, message, requestId: request.requestId });
  }
}
