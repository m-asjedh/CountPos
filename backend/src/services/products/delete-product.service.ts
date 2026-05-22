import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeleteProductService {
  constructor(private prisma: PrismaService) {}

  async execute(companyId: string, productId: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'DELETE',
        entity: 'Product',
        entityId: productId,
        description: `Product "${product.name}" deactivated`,
      },
    });

    return { message: 'Product deleted successfully' };
  }
}
