import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayCreditService {
  constructor(private prisma: PrismaService) {}

  async execute(companyId: string, invoiceId: string, amount: number, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { customer: true },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice is already fully paid');
    if (invoice.paymentMethod !== 'CREDIT') {
      throw new BadRequestException('This invoice is not a credit invoice');
    }

    const remaining = Number(invoice.balanceAmount);
    if (amount > remaining) {
      throw new BadRequestException(`Payment amount exceeds remaining balance (${remaining})`);
    }

    const newPaid = Number(invoice.paidAmount) + amount;
    const newBalance = remaining - amount;
    const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

    await this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaid, balanceAmount: newBalance, status: newStatus },
      });

      await tx.payment.create({
        data: { invoiceId, amount, method: 'CASH', status: 'PAID' },
      });

      if (invoice.customerId && invoice.customer) {
        const newCreditBalance = Number(invoice.customer.creditBalance) - amount;
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { creditBalance: Math.max(0, newCreditBalance) },
        });

        await tx.customerCreditTransaction.create({
          data: {
            customerId: invoice.customerId,
            invoiceId,
            type: 'PAYMENT',
            amount,
            balanceBefore: Number(invoice.customer.creditBalance),
            balanceAfter: Math.max(0, newCreditBalance),
            notes: `Payment for invoice ${invoice.invoiceNumber}`,
          },
        });
      }
    });

    return { success: true, message: 'Payment recorded', newBalance, newStatus };
  }
}
