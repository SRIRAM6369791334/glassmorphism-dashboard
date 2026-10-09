import 'reflect-metadata';
import 'dotenv/config';
import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { QueueModule } from './infrastructure/queue/queue.module';

async function bootstrap(): Promise<void> {
  const application = await NestFactory.createApplicationContext(QueueModule, {
    logger: new ConsoleLogger({ json: true }), abortOnError: false,
  });
  application.enableShutdownHooks();
}

bootstrap().catch(() => {
  process.stderr.write(`${JSON.stringify({ event: 'worker_startup_failed' })}\n`);
  process.exit(1);
});
