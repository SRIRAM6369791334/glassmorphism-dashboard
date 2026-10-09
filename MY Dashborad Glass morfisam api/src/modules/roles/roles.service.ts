import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class RolesService {
  async assignDefaultRole(tx: Prisma.TransactionClient, userId: bigint): Promise<void> {
    const role = await tx.role.upsert({
      where: { name: 'USER' },
      create: { name: 'USER', description: 'Standard authenticated account.', isSystem: true },
      update: {},
    });
    await tx.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });
  }
}
