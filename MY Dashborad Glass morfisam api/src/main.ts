import 'reflect-metadata';
import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config';
import { configureApp } from './common/http/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: new ConsoleLogger({ json: true }) });
  configureApp(app);
  const config = app.get(AppConfig).values;
  await app.listen(config.port, config.host);
}

bootstrap().catch(() => { process.stderr.write('{"event":"startup_failed","message":"Check local configuration and dependency availability."}\n'); process.exitCode = 1; });
