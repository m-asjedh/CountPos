import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApproveProductDto, RejectProductDto } from '../../dtos/products/approve-product.dto';

@Injectable()
export class ApproveProductService {
  constructor(private prisma: PrismaService) {}

  async approve(companyId: string, productId: string, dto: ApproveProductDto, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.approvalStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Product is not pending approval');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: 'ACTIVE',
        approvedById: userId,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    await this.prisma.productApprovalLog.create({
      data: {
        productId,
        reviewedById: userId,
        action: 'APPROVED',
        reason: dto.notes,
      },
    });

    await this.prisma.notification.create({
      data: {
        companyId,
        userId: product.createdById,
        type: 'PRODUCT_APPROVED',
        title: 'Product Approved',
        message: `Your product "${product.name}" has been approved and is now active in POS.`,
        data: { productId },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'APPROVE',
        entity: 'Product',
        entityId: productId,
        description: `Product "${product.name}" approved`,
      },
    });

    return updated;
  }

  async reject(companyId: string, productId: string, dto: RejectProductDto, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.approvalStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Product is not pending approval');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: dto.reason,
      },
    });

    await this.prisma.productApprovalLog.create({
      data: {
        productId,
        reviewedById: userId,
        action: 'REJECTED',
        reason: dto.reason,
      },
    });

    await this.prisma.notification.create({
      data: {
        companyId,
        userId: product.createdById,
        type: 'PRODUCT_REJECTED',
        title: 'Product Rejected',
        message: `Your product "${product.name}" was rejected. Reason: ${dto.reason || 'No reason provided'}`,
        data: { productId },
      },
    });

    return updated;
  }
}
