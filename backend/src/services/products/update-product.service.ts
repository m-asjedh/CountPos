import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProductDto } from '../../dtos/products/update-product.dto';

@Injectable()
export class UpdateProductService {
  constructor(private prisma: PrismaService) {}

  async execute(companyId: string, productId: string, dto: UpdateProductDto, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, companyId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...dto,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'UPDATE',
        entity: 'Product',
        entityId: productId,
        description: `Product "${product.name}" updated`,
      },
    });

    return updated;
  }
}
