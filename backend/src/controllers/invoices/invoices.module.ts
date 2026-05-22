import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { CreateInvoiceService } from '../../services/invoices/create-invoice.service';
import { GetInvoicesService } from '../../services/invoices/get-invoices.service';
import { HoldInvoiceService } from '../../services/invoices/hold-invoice.service';
import { PayCreditService } from '../../services/invoices/pay-credit.service';

@Module({
  controllers: [InvoicesController],
  providers: [CreateInvoiceService, GetInvoicesService, HoldInvoiceService, PayCreditService],
})
export class InvoicesModule {}
