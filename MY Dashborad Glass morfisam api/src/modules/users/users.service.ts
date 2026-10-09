import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../common/errors/api-error';
import { DatabaseService } from '../../infrastructure/database/database.service';

export interface PublicUser {
  id: string;
  email: string | null;
  displayName: string;
}

export const publicUserInclude = { profile: true } satisfies Prisma.UserInclude;
export type UserWithProfile = Prisma.UserGetPayload<{ include: typeof publicUserInclude }>;

export function toPublicUser(user: UserWithProfile): PublicUser {
  return { id: user.publicId, email: user.email, displayName: user.profile?.displayName ?? user.profile?.firstName ?? '' };
}

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async me(userId: bigint): Promise<PublicUser> {
    const user = await this.database.user.findUnique({ where: { id: userId }, include: publicUserInclude });
    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.');
    }
    return toPublicUser(user);
  }
}
