import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../dtos/categories/category.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCategoryDto,
  ) {
    const result = await this.prisma.category.create({
      data: { companyId: user.companyId, ...dto },
    });
    return { success: true, data: result };
  }

  @Get()
  async getAll(@CurrentUser() user: RequestUser) {
    const result = await this.prisma.category.findMany({
      where: { companyId: user.companyId, isActive: true },
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
    @Body() dto: UpdateCategoryDto,
  ) {
    const result = await this.prisma.category.updateMany({
      where: { id, companyId: user.companyId },
      data: dto,
    });
    return { success: true, data: result };
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.prisma.category.updateMany({
      where: { id, companyId: user.companyId },
      data: { isActive: false },
    });
    return { success: true, message: 'Category deleted' };
  }
}
