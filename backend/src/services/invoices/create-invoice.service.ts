import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from '../../dtos/invoices/create-invoice.dto';

@Injectable()
export class CreateInvoiceService {
  constructor(private prisma: PrismaService) {}

  async execute(companyId: string, dto: CreateInvoiceDto, userId: string) {
    const settings = await this.prisma.companySettings.findUnique({ where: { companyId } });

    if (dto.paymentMethod === 'CREDIT' && !dto.customerId) {
      throw new BadRequestException('Customer is required for credit sales');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, companyId, approvalStatus: 'ACTIVE', isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found or not available');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let totalDiscount = 0;
    let totalProfit = 0;
    const lineItems: {
      productId: string;
      productName: string;
      sku: string;
      quantity: number;
      unit: string;
      costPrice: number;
      sellingPrice: number;
      discountPercent: number;
      discountAmount: number;
      taxAmount: number;
      lineTotal: number;
      profit: number;
    }[] = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      if (product.currentStock < item.quantity) {
        throw new UnprocessableEntityException(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}`,
        );
      }

      const discountPercent = item.discountPercent ?? 0;
      if (discountPercent > 0 && product.discountEnabled) {
        if (Number(product.maxDiscountPercent) > 0 && discountPercent > Number(product.maxDiscountPercent)) {
          throw new BadRequestException(
            `Discount for "${product.name}" exceeds maximum allowed (${product.maxDiscountPercent}%)`,
          );
        }
      } else if (discountPercent > 0 && !product.discountEnabled) {
        throw new BadRequestException(`Discount is not allowed for "${product.name}"`);
      }

      const sellingPrice = Number(product.sellingPrice);
      const costPrice = Number(product.costPrice);
      const discountAmount = (sellingPrice * discountPercent) / 100;
      const effectivePrice = sellingPrice - discountAmount;
      const lineTotal = effectivePrice * item.quantity;
      const profit = (effectivePrice - costPrice) * item.quantity;

      subtotal += sellingPrice * item.quantity;
      totalDiscount += discountAmount * item.quantity;
      totalProfit += profit;

      lineItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit: product.unit,
        costPrice,
        sellingPrice,
        discountPercent,
        discountAmount: discountAmount * item.quantity,
        taxAmount: 0,
        lineTotal,
        profit,
      });
    }

    const taxRate = settings?.taxEnabled ? Number(settings.taxRate) : 0;
    const taxableAmount = subtotal - totalDiscount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    let paidAmount = 0;
    let balanceAmount = 0;
    let invoiceStatus: 'PAID' | 'PENDING' | 'PARTIALLY_PAID' = 'PAID';
    let changeGiven = 0;
    let cashReceived = dto.cashReceived ?? 0;

    if (dto.paymentMethod === 'CASH') {
      if (cashReceived < totalAmount) {
        throw new BadRequestException(`Cash received (${cashReceived}) is less than total (${totalAmount})`);
      }
      paidAmount = totalAmount;
      balanceAmount = 0;
      changeGiven = cashReceived - totalAmount;
      invoiceStatus = 'PAID';
    } else {
      paidAmount = 0;
      balanceAmount = totalAmount;
      invoiceStatus = 'PENDING';
    }

    const invoicePrefix = settings?.invoicePrefix || 'INV';
    const counter = settings?.invoiceCounter || 1;
    const invoiceNumber = `${invoicePrefix}-${String(counter).padStart(6, '0')}`;

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          companyId,
          customerId: dto.customerId,
          createdById: userId,
          invoiceNumber,
          subtotal,
          discountAmount: totalDiscount,
          taxAmount,
          totalAmount,
          paidAmount,
          balanceAmount,
          paymentMethod: dto.paymentMethod,
          status: invoiceStatus,
          notes: dto.notes,
          cashReceived: dto.paymentMethod === 'CASH' ? cashReceived : undefined,
          changeGiven: dto.paymentMethod === 'CASH' ? changeGiven : undefined,
          profit: totalProfit,
          items: {
            create: lineItems,
          },
          payments: {
            create:
              dto.paymentMethod === 'CASH'
                ? [{ amount: paidAmount, method: 'CASH', status: 'PAID' }]
                : [],
          },
        },
        include: {
          items: true,
          customer: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const newStock = product.currentStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: newStock,
            approvalStatus: newStock === 0 ? 'OUT_OF_STOCK' : undefined,
          },
        });

        await tx.inventoryLog.create({
          data: {
            companyId,
            productId: item.productId,
            type: 'SALE',
            quantity: item.quantity,
            quantityBefore: product.currentStock,
            quantityAfter: newStock,
            reference: invoiceNumber,
            notes: `Sold via invoice ${invoiceNumber}`,
            createdById: userId,
          },
        });

        if (newStock <= product.lowStockThreshold && newStock > 0) {
          await tx.notification.create({
            data: {
              companyId,
              type: 'LOW_STOCK',
              title: 'Low Stock Alert',
              message: `Product "${product.name}" is running low. Current stock: ${newStock}`,
              data: { productId: product.id },
            },
          });
        }
      }

      if (dto.paymentMethod === 'CREDIT' && dto.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: dto.customerId } });
        if (customer) {
          const newBalance = Number(customer.creditBalance) + totalAmount;
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { creditBalance: newBalance },
          });

          await tx.customerCreditTransaction.create({
            data: {
              customerId: dto.customerId,
              invoiceId: created.id,
              type: 'CREDIT',
              amount: totalAmount,
              balanceBefore: Number(customer.creditBalance),
              balanceAfter: newBalance,
              notes: `Credit sale - Invoice ${invoiceNumber}`,
            },
          });
        }
      }

      await tx.companySettings.update({
        where: { companyId },
        data: { invoiceCounter: { increment: 1 } },
      });

      return created;
    });

    return invoice;
  }
}
