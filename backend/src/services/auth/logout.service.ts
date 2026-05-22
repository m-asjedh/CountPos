import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LogoutService {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, companyId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        description: 'User logged out',
      },
    });
  }
}
