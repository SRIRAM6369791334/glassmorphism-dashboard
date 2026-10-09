import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { OutboxDispatcher } from './outbox-dispatcher.service';
import { OutboxProcessor } from './outbox-processor.service';

// Imported only by the worker entrypoint. API replicas do not run background consumers.
@Module({
  imports: [AppConfigModule, DatabaseModule, EmailModule],
  providers: [OutboxDispatcher, OutboxProcessor],
})
export class QueueModule {}
