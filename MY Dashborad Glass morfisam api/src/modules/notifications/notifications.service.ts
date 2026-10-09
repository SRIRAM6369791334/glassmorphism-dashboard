import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Foundation for future domain modules; callers supply their existing transaction. */
@Injectable()
export class NotificationsService {
  create(tx: Prisma.TransactionClient, userId: bigint, notice: { type: string; title: string; message: string }) {
    return tx.notification.create({ data: { userId, ...notice } });
  }
}
