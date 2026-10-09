import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../modules/permissions/permissions.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions';
import { ApiError } from '../errors/api-error';
import { ApiRequest } from '../http/request-context';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly permissions: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) ?? [];
    const { auth } = context.switchToHttp().getRequest<ApiRequest>();
    if (!auth) throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.');
    if (!(await this.permissions.allows(auth.userId, required))) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to perform this action.');
    }
    return true;
  }
}
