import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from '../../dtos/users/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CreateUserService {
  constructor(private prisma: PrismaService) {}

  async execute(companyId: string, dto: CreateUserDto, createdById: string) {
    const existing = await this.prisma.user.findUnique({
      where: { companyId_email: { companyId, email: dto.email } },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists in this company');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        companyId,
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role || 'CASHIER',
        permissions: dto.permissions
          ? {
              create: dto.permissions.map((p) => ({ permission: p, granted: true })),
            }
          : undefined,
      },
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
        userId: createdById,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        description: `Staff user ${user.email} created`,
      },
    });

    return user;
  }
}
