import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateCustomerDto, UpdateCustomerDto } from '../../dtos/customers/customer.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateCustomerDto) {
    const result = await this.prisma.customer.create({
      data: { companyId: user.companyId, ...dto },
    });
    return { success: true, data: result };
  }

  @Get()
  async getAll(@CurrentUser() user: RequestUser, @Query('search') search?: string) {
    const where: Record<string, unknown> = {
      companyId: user.companyId, isActive: true,
    };
    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const result = await this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { success: true, data: result };
  }

  @Get(':id')
  async getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        invoices: {
          select: { id: true, invoiceNumber: true, totalAmount: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        creditTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!customer) return { success: false, message: 'Customer not found' };
    return { success: true, data: customer };
  }

  @Patch(':id')
  async update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    await this.prisma.customer.updateMany({ where: { id, companyId: user.companyId }, data: dto });
    const result = await this.prisma.customer.findFirst({ where: { id, companyId: user.companyId } });
    return { success: true, data: result };
  }

  @Post(':id/settle-credit')
  async settleCredit(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    const customer = await this.prisma.customer.findFirst({ where: { id, companyId: user.companyId } });
    if (!customer) return { success: false, message: 'Customer not found' };

    const settleAmount = Math.min(amount, Number(customer.creditBalance));
    const newBalance = Number(customer.creditBalance) - settleAmount;

    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id },
        data: { creditBalance: newBalance },
      }),
      this.prisma.customerCreditTransaction.create({
        data: {
          customerId: id,
          type: 'PAYMENT',
          amount: settleAmount,
          balanceBefore: Number(customer.creditBalance),
          balanceAfter: newBalance,
          notes: 'Credit settlement',
        },
      }),
    ]);

    return { success: true, message: 'Credit settled', data: { settledAmount: settleAmount, newBalance } };
  }
}
