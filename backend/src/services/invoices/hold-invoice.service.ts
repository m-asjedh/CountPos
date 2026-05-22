import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CartData {
  items: unknown[];
  customerId?: string;
  notes?: string;
  [key: string]: unknown;
}

@Injectable()
export class HoldInvoiceService {
  constructor(private prisma: PrismaService) {}

  async hold(companyId: string, userId: string, cartData: CartData, label?: string) {
    const held = await this.prisma.heldInvoice.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { companyId, createdById: userId, cartData: cartData as any, label },
    });
    return held;
  }

  async getHeld(companyId: string) {
    return this.prisma.heldInvoice.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resumeHeld(companyId: string, heldId: string) {
    const held = await this.prisma.heldInvoice.findFirst({
      where: { id: heldId, companyId },
    });
    if (!held) throw new NotFoundException('Held invoice not found');

    await this.prisma.heldInvoice.delete({ where: { id: heldId } });
    return held;
  }

  async deleteHeld(companyId: string, heldId: string) {
    await this.prisma.heldInvoice.deleteMany({ where: { id: heldId, companyId } });
    return { message: 'Held invoice deleted' };
  }
}
