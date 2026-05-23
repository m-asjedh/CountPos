import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('sales')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getSalesReport(
    @CurrentUser() user: RequestUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const where: Record<string, unknown> = {
      companyId: user.companyId,
      status: { not: 'CANCELLED' },
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter['gte'] = new Date(startDate);
      if (endDate) dateFilter['lte'] = new Date(endDate);
      where['createdAt'] = dateFilter;
    }

    const [summary, byCashMethod, byCreditMethod] = await Promise.all([
      this.prisma.invoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          profit: true,
          paidAmount: true,
          balanceAmount: true,
          discountAmount: true,
        },
        _count: { id: true },
        _avg: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, paymentMethod: 'CASH' },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, paymentMethod: 'CREDIT' },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalSales: Number(summary._sum.totalAmount || 0),
        totalProfit: Number(summary._sum.profit || 0),
        totalReceived: Number(summary._sum.paidAmount || 0),
        totalPending: Number(summary._sum.balanceAmount || 0),
        totalDiscounts: Number(summary._sum.discountAmount || 0),
        totalInvoices: summary._count.id,
        avgOrderValue: Number(summary._avg.totalAmount || 0),
        cashSales: {
          amount: Number(byCashMethod._sum.totalAmount || 0),
          count: byCashMethod._count.id,
        },
        creditSales: {
          amount: Number(byCreditMethod._sum.totalAmount || 0),
          count: byCreditMethod._count.id,
        },
      },
    };
  }

  @Get('products')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getProductsReport(@CurrentUser() user: RequestUser) {
    const [total, active, pendingApproval, lowStock, outOfStock] =
      await Promise.all([
        this.prisma.product.count({
          where: { companyId: user.companyId, isActive: true },
        }),
        this.prisma.product.count({
          where: {
            companyId: user.companyId,
            approvalStatus: 'ACTIVE',
            isActive: true,
          },
        }),
        this.prisma.product.count({
          where: {
            companyId: user.companyId,
            approvalStatus: 'PENDING_APPROVAL',
          },
        }),
        this.prisma.product
          .findMany({
            where: {
              companyId: user.companyId,
              approvalStatus: 'ACTIVE',
              isActive: true,
              currentStock: { gt: 0 },
            },
            select: { currentStock: true, lowStockThreshold: true },
          })
          .then(
            (products) =>
              products.filter((p) => p.currentStock <= p.lowStockThreshold)
                .length,
          ),
        this.prisma.product.count({
          where: { companyId: user.companyId, approvalStatus: 'OUT_OF_STOCK' },
        }),
      ]);

    return {
      success: true,
      data: { total, active, pendingApproval, lowStock, outOfStock },
    };
  }

  @Get('staff-performance')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getStaffPerformance(
    @CurrentUser() user: RequestUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const where: Record<string, unknown> = {
      companyId: user.companyId,
      status: { not: 'CANCELLED' },
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter['gte'] = new Date(startDate);
      if (endDate) dateFilter['lte'] = new Date(endDate);
      where['createdAt'] = dateFilter;
    }

    const performance = await this.prisma.invoice.groupBy({
      by: ['createdById'],
      where,
      _sum: { totalAmount: true, profit: true },
      _count: { id: true },
    });

    const staffIds = performance.map((p) => p.createdById);
    const staff = await this.prisma.user.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    const staffMap = new Map(staff.map((s) => [s.id, s]));
    const result = performance.map((p) => ({
      ...staffMap.get(p.createdById),
      totalSales: Number(p._sum.totalAmount || 0),
      totalProfit: Number(p._sum.profit || 0),
      invoiceCount: p._count.id,
    }));

    return { success: true, data: result };
  }

  @Get('credit-customers')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getCreditCustomers(@CurrentUser() user: RequestUser) {
    const customers = await this.prisma.customer.findMany({
      where: { companyId: user.companyId, creditBalance: { gt: 0 } },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        creditBalance: true,
        creditLimit: true,
        invoices: {
          where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
          select: {
            id: true,
            invoiceNumber: true,
            balanceAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { creditBalance: 'desc' },
    });

    return { success: true, data: customers };
  }

  @Get('export/sales')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async exportSalesCSV(
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const where: Record<string, unknown> = {
      companyId: user.companyId,
      status: { not: 'CANCELLED' },
    };
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter['gte'] = new Date(startDate);
      if (endDate) dateFilter['lte'] = new Date(endDate);
      where['createdAt'] = dateFilter;
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvRows = [
      'Invoice Number,Date,Customer,Payment Method,Subtotal,Discount,Tax,Total,Paid,Balance,Status,Cashier',
      ...invoices.map((inv) =>
        [
          inv.invoiceNumber,
          inv.createdAt.toISOString(),
          inv.customer?.name || 'Walk-in',
          inv.paymentMethod,
          inv.subtotal,
          inv.discountAmount,
          inv.taxAmount,
          inv.totalAmount,
          inv.paidAmount,
          inv.balanceAmount,
          inv.status,
          `${inv.createdBy.firstName} ${inv.createdBy.lastName}`,
        ].join(','),
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-report.csv',
    );
    res.send(csvRows);
  }
}
