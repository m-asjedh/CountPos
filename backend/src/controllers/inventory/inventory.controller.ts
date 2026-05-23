import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { StockAdjustmentDto } from '../../dtos/inventory/stock-adjustment.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private prisma: PrismaService) {}

  @Post('adjust')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  @HttpCode(HttpStatus.CREATED)
  async adjust(
    @CurrentUser() user: RequestUser,
    @Body() dto: StockAdjustmentDto,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, companyId: user.companyId },
    });
    if (!product) return { success: false, message: 'Product not found' };

    const isIncoming = ['STOCK_IN', 'OPENING', 'RETURN'].includes(dto.type);
    const newStock = isIncoming
      ? product.currentStock + dto.quantity
      : Math.max(0, product.currentStock - dto.quantity);

    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { currentStock: newStock },
      }),
      this.prisma.inventoryLog.create({
        data: {
          companyId: user.companyId,
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          quantityBefore: product.currentStock,
          quantityAfter: newStock,
          notes: dto.notes,
          createdById: user.id,
        },
      }),
      this.prisma.stockAdjustment.create({
        data: {
          companyId: user.companyId,
          productId: dto.productId,
          type: dto.type,
          quantity: dto.quantity,
          reason: dto.reason,
          notes: dto.notes,
          adjustedById: user.id,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          action: isIncoming ? 'STOCK_IN' : 'STOCK_OUT',
          entity: 'Product',
          entityId: dto.productId,
          description: `Stock adjusted: ${product.name} (${isIncoming ? '+' : '-'}${dto.quantity}). Reason: ${dto.reason || 'Manual adjustment'}`,
        },
      }),
    ]);

    return { success: true, message: 'Stock adjusted', data: { newStock } };
  }

  @Get('logs')
  async getLogs(
    @CurrentUser() user: RequestUser,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {
      companyId: user.companyId,
    };
    if (productId) where['productId'] = productId;
    if (type) where['type'] = type;

    const [logs, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs,
      meta: { total, page: Number(page), limit: Number(limit) },
    };
  }

  @Get('alerts')
  async getAlerts(@CurrentUser() user: RequestUser) {
    const [lowStock, outOfStock, nearExpiry, expired] = await Promise.all([
      this.prisma.product
        .findMany({
          where: {
            companyId: user.companyId,
            approvalStatus: 'ACTIVE',
            isActive: true,
            currentStock: { gt: 0 },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            currentStock: true,
            lowStockThreshold: true,
            reorderLevel: true,
          },
        })
        .then((products) =>
          products.filter((p) => p.currentStock <= p.lowStockThreshold),
        ),
      this.prisma.product.findMany({
        where: {
          companyId: user.companyId,
          approvalStatus: 'OUT_OF_STOCK',
          isActive: true,
        },
        select: { id: true, name: true, sku: true, currentStock: true },
      }),
      this.prisma.product.findMany({
        where: {
          companyId: user.companyId,
          isActive: true,
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          expiryDate: true,
          currentStock: true,
        },
      }),
      this.prisma.product.findMany({
        where: {
          companyId: user.companyId,
          isActive: true,
          expiryDate: { lt: new Date() },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          expiryDate: true,
          currentStock: true,
        },
      }),
    ]);

    return {
      success: true,
      data: { lowStock, outOfStock, nearExpiry, expired },
    };
  }
}
