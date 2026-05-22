import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ApprovalStatus } from '@prisma/client';

interface GetProductsQuery {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  approvalStatus?: ApprovalStatus;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetProductsService {
  constructor(private prisma: PrismaService) {}

  async getAll(companyId: string, query: GetProductsQuery) {
    const { search, categoryId, supplierId, approvalStatus, lowStock, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      companyId,
      isActive: true,
    };

    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where['categoryId'] = categoryId;
    if (supplierId) where['supplierId'] = supplierId;
    if (approvalStatus) where['approvalStatus'] = approvalStatus;
    if (lowStock) {
      where['AND'] = [
        { currentStock: { lte: 5 } },
        { currentStock: { gt: 0 } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(companyId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
      include: {
        category: true,
        supplier: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        approvalLogs: {
          include: { reviewedBy: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getPendingApprovals(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId, approvalStatus: 'PENDING_APPROVAL' },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForPOS(companyId: string, search?: string) {
    const where: Record<string, unknown> = {
      companyId,
      approvalStatus: 'ACTIVE',
      isActive: true,
    };

    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        unit: true,
        sellingPrice: true,
        costPrice: true,
        currentStock: true,
        discountEnabled: true,
        maxDiscountPercent: true,
        maxDiscountAmount: true,
        category: { select: { id: true, name: true } },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }
}
