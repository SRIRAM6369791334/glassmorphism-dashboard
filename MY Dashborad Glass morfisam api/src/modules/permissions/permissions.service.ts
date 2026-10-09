import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

export function hasEveryPermission(granted: readonly string[], required: readonly string[]): boolean {
  const permissions = new Set(granted);
  return required.every((permission) => permissions.has(permission));
}

@Injectable()
export class PermissionsService {
  constructor(private readonly database: DatabaseService) {}

  async allows(userId: bigint, required: readonly string[]): Promise<boolean> {
    const assignments = await this.database.userRole.findMany({
      where: { userId },
      select: { role: { select: { permissions: { select: { permission: { select: { name: true } } } } } } },
    });
    return hasEveryPermission(assignments.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.name)), required);
  }
}
