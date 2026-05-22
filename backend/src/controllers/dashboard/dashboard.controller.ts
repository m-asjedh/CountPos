import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../types/auth.types';

function getDateRange(period: string) {
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: RequestUser, @Query('period') period = 'today') {
    const { start, end } = getDateRange(period);
    const companyId = user.companyId;

    const [
      invoiceStats,
      pendingCredit,
      totalCustomers,
      lowStockCount,
      outOfStockCount,
      pendingApprovals,
      nearExpiry,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { companyId, createdAt: { gte: start, lte: end } },
        _sum: { totalAmount: true, profit: true, paidAmount: true, balanceAmount: true },
        _count: { id: true },
      }),
      this.prisma.invoice.aggregate({
        where: { companyId, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        _sum: { balanceAmount: true },
      }),
      this.prisma.customer.count({ where: { companyId, isActive: true } }),
      this.prisma.product.count({
        where: { companyId, approvalStatus: 'ACTIVE', isActive: true },
      }).then(async () => {
        const products = await this.prisma.product.findMany({
          where: { companyId, approvalStatus: 'ACTIVE', isActive: true, currentStock: { gt: 0 } },
          select: { currentStock: true, lowStockThreshold: true },
        });
        return products.filter((p) => p.currentStock <= p.lowStockThreshold).length;
      }),
      this.prisma.product.count({ where: { companyId, approvalStatus: 'OUT_OF_STOCK', isActive: true } }),
      this.prisma.product.count({ where: { companyId, approvalStatus: 'PENDING_APPROVAL' } }),
      this.prisma.product.count({
        where: {
          companyId,
          isActive: true,
          expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        period,
        sales: Number(invoiceStats._sum.totalAmount || 0),
        profit: Number(invoiceStats._sum.profit || 0),
        receivedCash: Number(invoiceStats._sum.paidAmount || 0),
        pendingCredit: Number(pendingCredit._sum.balanceAmount || 0),
        totalInvoices: invoiceStats._count.id,
        totalCustomers,
        lowStockCount,
        outOfStockCount,
        pendingApprovals,
        nearExpiry,
      },
    };
  }

  @Get('sales-trend')
  async getSalesTrend(@CurrentUser() user: RequestUser, @Query('days') days = 30) {
    const companyId = user.companyId;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const invoices = await this.prisma.invoice.findMany({
      where: { companyId, createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
      select: { totalAmount: true, profit: true, createdAt: true, paymentMethod: true },
    });

    const grouped: Record<string, { date: string; sales: number; profit: number; cash: number; credit: number }> = {};

    for (const inv of invoices) {
      const date = inv.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, sales: 0, profit: 0, cash: 0, credit: 0 };
      }
      grouped[date].sales += Number(inv.totalAmount);
      grouped[date].profit += Number(inv.profit);
      if (inv.paymentMethod === 'CASH') {
        grouped[date].cash += Number(inv.totalAmount);
      } else {
        grouped[date].credit += Number(inv.totalAmount);
      }
    }

    const trend = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    return { success: true, data: trend };
  }

  @Get('top-products')
  async getTopProducts(@CurrentUser() user: RequestUser, @Query('period') period = 'month') {
    const { start } = getDateRange(period);
    const companyId = user.companyId;

    const items = await this.prisma.invoiceItem.groupBy({
      by: ['productId', 'productName'],
      where: { invoice: { companyId, createdAt: { gte: start }, status: { not: 'CANCELLED' } } },
      _sum: { lineTotal: true, quantity: true, profit: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 10,
    });

    return { success: true, data: items };
  }

  @Get('recent-invoices')
  async getRecentInvoices(@CurrentUser() user: RequestUser) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId: user.companyId },
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return { success: true, data: invoices };
  }

  @Get('notifications')
  async getNotifications(@CurrentUser() user: RequestUser) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        companyId: user.companyId,
        OR: [{ userId: user.id }, { userId: null }],
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return { success: true, data: notifications };
  }
}
