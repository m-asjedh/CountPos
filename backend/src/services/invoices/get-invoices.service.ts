import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { InvoiceStatus, PaymentMethod } from '@prisma/client';

interface GetInvoicesQuery {
  search?: string;
  status?: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class GetInvoicesService {
  constructor(private prisma: PrismaService) {}

  async getAll(companyId: string, query: GetInvoicesQuery) {
    const { search, status, paymentMethod, customerId, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId };

    if (search) {
      where['OR'] = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where['status'] = status;
    if (paymentMethod) where['paymentMethod'] = paymentMethod;
    if (customerId) where['customerId'] = customerId;
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter['gte'] = new Date(startDate);
      if (endDate) dateFilter['lte'] = new Date(endDate);
      where['createdAt'] = dateFilter;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(companyId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true, unit: true } } } },
        customer: true,
        payments: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }
}
