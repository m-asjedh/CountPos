import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
} from '../../dtos/suppliers/supplier.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateSupplierDto,
  ) {
    const result = await this.prisma.supplier.create({
      data: { companyId: user.companyId, ...dto },
    });
    return { success: true, data: result };
  }

  @Get()
  async getAll(
    @CurrentUser() user: RequestUser,
    @Query('search') search?: string,
  ) {
    const where: Record<string, unknown> = {
      companyId: user.companyId,
      isActive: true,
    };
    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const result = await this.prisma.supplier.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: result };
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    await this.prisma.supplier.updateMany({
      where: { id, companyId: user.companyId },
      data: dto,
    });
    const result = await this.prisma.supplier.findFirst({
      where: { id, companyId: user.companyId },
    });
    return { success: true, data: result };
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.prisma.supplier.updateMany({
      where: { id, companyId: user.companyId },
      data: { isActive: false },
    });
    return { success: true, message: 'Supplier deleted' };
  }
}
