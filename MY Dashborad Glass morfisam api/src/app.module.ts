import { Module } from '@nestjs/common';
import { CoreModule } from './common/core.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({ imports: [CoreModule, AuthModule] })
export class AppModule {}
