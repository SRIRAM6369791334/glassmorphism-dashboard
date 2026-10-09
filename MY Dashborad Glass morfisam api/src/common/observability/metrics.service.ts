import { Global, Injectable, Module } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly requests = new Counter({ name: 'http_requests_total', help: 'Completed requests', labelNames: ['method', 'route', 'status'], registers: [this.registry] });
  readonly latency = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['method', 'route'], buckets: [.005, .025, .05, .1, .25, .5, 1, 2, 5, 15], registers: [this.registry] });
  readonly dependencies = new Histogram({ name: 'dependency_probe_duration_seconds', help: 'Dependency probe duration', labelNames: ['dependency'], registers: [this.registry] });
  readonly queueDepth = new Gauge({ name: 'email_queue_jobs', help: 'Current queue jobs by state', labelNames: ['state'], registers: [this.registry] });
  readonly dbConnections = new Gauge({ name: 'mysql_threads_connected', help: 'MySQL server connected threads; use server exporter for pool details', registers: [this.registry] });
  readonly dbQueries = new Histogram({ name: 'mysql_query_duration_seconds', help: 'Prisma query durations without SQL or parameters', buckets: [.001, .005, .01, .05, .1, .5, 1, 5], registers: [this.registry] });
  readonly redisCache = new Gauge({ name: 'redis_keyspace_operations_total', help: 'Redis server cumulative cache outcomes', labelNames: ['outcome'], registers: [this.registry] });
  readonly redisMemory = new Gauge({ name: 'redis_used_memory_bytes', help: 'Redis server memory usage', registers: [this.registry] });
  constructor() { collectDefaultMetrics({ register: this.registry }); }
  recordDependency(name: 'mysql' | 'redis', durationSeconds: number) { this.dependencies.observe({ dependency: name }, durationSeconds); }
}

@Global()
@Module({ providers: [MetricsService], exports: [MetricsService] })
export class TelemetryModule {}
