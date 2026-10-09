import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionsService } from './permissions.service';

@Module({ providers: [PermissionsService, PermissionsGuard], exports: [PermissionsService, PermissionsGuard] })
export class PermissionsModule {}
