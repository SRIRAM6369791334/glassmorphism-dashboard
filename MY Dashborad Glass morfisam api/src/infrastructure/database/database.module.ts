import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config';
import { DatabaseService } from './database.service';
import { TelemetryModule } from '../../common/observability/metrics.service';

@Global()
@Module({ imports: [AppConfigModule, TelemetryModule], providers: [DatabaseService], exports: [DatabaseService] })
export class DatabaseModule {}
