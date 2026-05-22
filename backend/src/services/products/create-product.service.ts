import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from '../../dtos/products/create-product.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CreateProductService {
  constructor(private prisma: PrismaService) {}

  async execute(companyId: string, dto: CreateProductDto, userId: string, userRole: UserRole) {
    const existing = await this.prisma.product.findUnique({
      where: { companyId_sku: { companyId, sku: dto.sku } },
    });
    if (existing) throw new ConflictException('A product with this SKU already exists');

    const isAdmin = ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole);
    const approvalStatus = isAdmin ? 'ACTIVE' : 'PENDING_APPROVAL';

    const product = await this.prisma.product.create({
      data: {
        companyId,
        createdById: userId,
        approvedById: isAdmin ? userId : undefined,
        approvedAt: isAdmin ? new Date() : undefined,
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        brand: dto.brand,
        description: dto.description,
        unit: dto.unit || 'pcs',
        categoryId: dto.categoryId,
        supplierId: dto.supplierId,
        costPrice: dto.costPrice,
        sellingPrice: dto.sellingPrice,
        discountEnabled: dto.discountEnabled ?? false,
        maxDiscountPercent: dto.maxDiscountPercent ?? 0,
        maxDiscountAmount: dto.maxDiscountAmount ?? 0,
        openingStock: dto.openingStock ?? 0,
        currentStock: dto.openingStock ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        shelfNumber: dto.shelfNumber,
        shelfRow: dto.shelfRow,
        rackNumber: dto.rackNumber,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        batchNumber: dto.batchNumber,
        approvalStatus,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (dto.openingStock && dto.openingStock > 0) {
      await this.prisma.inventoryLog.create({
        data: {
          companyId,
          productId: product.id,
          type: 'OPENING',
          quantity: dto.openingStock,
          quantityBefore: 0,
          quantityAfter: dto.openingStock,
          notes: 'Opening stock',
          createdById: userId,
        },
      });
    }

    if (!isAdmin) {
      await this.prisma.notification.create({
        data: {
          companyId,
          type: 'PRODUCT_PENDING_APPROVAL',
          title: 'New Product Pending Approval',
          message: `Product "${dto.name}" (SKU: ${dto.sku}) was created by staff and requires your approval.`,
          data: { productId: product.id },
        },
      });
    }

    return product;
  }
}
