import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from '../../dtos/users/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UpdateUserService {
  constructor(private prisma: PrismaService) {}

  async execute(companyId: string, userId: string, dto: UpdateUserDto, updatedById: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new NotFoundException('User not found');

    const updateData: Record<string, unknown> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password) updateData.password = await bcrypt.hash(dto.password, 12);

    if (dto.permissions) {
      await this.prisma.userPermission.deleteMany({ where: { userId } });
      updateData['permissions'] = {
        create: dto.permissions.map((p) => ({ permission: p, granted: true })),
      };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData as Parameters<typeof this.prisma.user.update>[0]['data'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        permissions: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId: updatedById,
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        description: `User ${user.email} updated`,
      },
    });

    return updated;
  }
}
