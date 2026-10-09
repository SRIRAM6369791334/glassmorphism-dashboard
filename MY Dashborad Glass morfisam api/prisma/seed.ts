import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const database = new PrismaClient();
const permissionNames = [
  'profile:read', 'profile:update', 'notifications:read', 'notifications:update',
  'roles:read', 'permissions:read',
] as const;

async function seed(): Promise<void> {
  await database.$transaction(async (transaction) => {
    const userRole = await transaction.role.upsert({
      where: { name: 'USER' },
      create: { name: 'USER', description: 'Authenticated account', isSystem: true },
      update: {},
    });
    const adminRole = await transaction.role.upsert({
      where: { name: 'ADMIN' },
      create: { name: 'ADMIN', description: 'Foundation administrator', isSystem: true },
      update: {},
    });
    for (const name of permissionNames) {
      const [resource, action] = name.split(':');
      const permission = await transaction.permission.upsert({
        where: { name }, create: { name, resource, action }, update: {},
      });
      const roles = resource === 'roles' || resource === 'permissions' ? [adminRole] : [userRole, adminRole];
      for (const role of roles) {
        await transaction.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
          create: { roleId: role.id, permissionId: permission.id }, update: {},
        });
      }
    }
  });
}

seed().catch(() => {
  process.stderr.write('Foundation seed failed. Check database connectivity and migrations.\n');
  process.exitCode = 1;
}).finally(() => database.$disconnect());
