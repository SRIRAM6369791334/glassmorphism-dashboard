import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import express, { type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppConfig } from '../../config/app-config';
import { MetricsService } from '../observability/metrics.service';
import { ApiExceptionFilter } from './exception.filter';
import type { ApiRequest } from './request-context';

export function configureApp(application: INestApplication) {
  const app = application as NestExpressApplication;
  const cfg = app.get(AppConfig).values; const metrics = app.get(MetricsService);
  app.set('trust proxy', cfg.trustProxy.length ? cfg.trustProxy : false);
  app.disable('x-powered-by');
  app.use((req: ApiRequest, res: Response, next: NextFunction) => {
    req.requestId = `req_${randomUUID()}`;
    res.setHeader('X-Request-Id', req.requestId);
    res.setHeader('Cache-Control', 'no-store');
    const start = performance.now();
    res.on('finish', () => {
      const seconds = (performance.now() - start) / 1000;
      const route = typeof req.route?.path === 'string' ? req.route.path : 'unmatched';
      metrics.requests.inc({ method: req.method, route, status: res.statusCode });
      metrics.latency.observe({ method: req.method, route }, seconds);
      process.stdout.write(JSON.stringify({ event: 'http_request', requestId: req.requestId, method: req.method, route, status: res.statusCode, durationMs: Math.round(seconds * 1000) }) + '\n');
    });
    next();
  });
  app.use(helmet({ strictTransportSecurity: cfg.production ? { maxAge: 31536000, includeSubDomains: true } : false }));
  app.enableCors({
    origin: cfg.corsOrigins, credentials: true, methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'], exposedHeaders: ['X-Request-Id', 'Retry-After'], maxAge: 600,
  });
  app.use((req: ApiRequest, res: Response, next: NextFunction) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('Origin');
      if ((origin && !cfg.corsOrigins.includes(origin)) || (!origin && req.headers.cookie)) {
        res.status(403).json({ success: false, code: 'ORIGIN_REJECTED', message: 'This request origin is not allowed.', requestId: req.requestId }); return;
      }
      if (!req.is('application/json')) {
        res.status(415).json({ success: false, code: 'JSON_REQUIRED', message: 'Use application/json for this request.', requestId: req.requestId }); return;
      }
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1', { exclude: [
    { path: 'health/live', method: RequestMethod.GET }, { path: 'health/ready', method: RequestMethod.GET }, { path: 'metrics', method: RequestMethod.GET },
  ] });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, validationError: { target: false, value: false } }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
}
