import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateInvoiceDto } from '../../dtos/invoices/create-invoice.dto';
import { CreateInvoiceService } from '../../services/invoices/create-invoice.service';
import { GetInvoicesService } from '../../services/invoices/get-invoices.service';
import { HoldInvoiceService } from '../../services/invoices/hold-invoice.service';
import { PayCreditService } from '../../services/invoices/pay-credit.service';
import type { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(
    private createInvoiceService: CreateInvoiceService,
    private getInvoicesService: GetInvoicesService,
    private holdInvoiceService: HoldInvoiceService,
    private payCreditService: PayCreditService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateInvoiceDto) {
    const result = await this.createInvoiceService.execute(user.companyId, dto, user.id);
    return { success: true, data: result, message: 'Invoice created successfully' };
  }

  @Get()
  async getAll(
    @CurrentUser() user: RequestUser,
    @Query('search') search?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.getInvoicesService.getAll(user.companyId, {
      search, status, paymentMethod, customerId, startDate, endDate, page, limit,
    });
    return { success: true, ...result };
  }

  @Get('held')
  async getHeld(@CurrentUser() user: RequestUser) {
    const result = await this.holdInvoiceService.getHeld(user.companyId);
    return { success: true, data: result };
  }

  @Get(':id')
  async getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.getInvoicesService.getById(user.companyId, id);
    return { success: true, data: result };
  }

  @Post('hold')
  async holdInvoice(
    @CurrentUser() user: RequestUser,
    @Body() body: { cartData: { items: unknown[]; customerId?: string }; label?: string },
  ) {
    const result = await this.holdInvoiceService.hold(user.companyId, user.id, body.cartData, body.label);
    return { success: true, data: result, message: 'Invoice held' };
  }

  @Post('held/:id/resume')
  async resumeHeld(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.holdInvoiceService.resumeHeld(user.companyId, id);
    return { success: true, data: result };
  }

  @Delete('held/:id')
  async deleteHeld(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.holdInvoiceService.deleteHeld(user.companyId, id);
    return { success: true, ...result };
  }

  @Post(':id/pay-credit')
  async payCredit(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    const result = await this.payCreditService.execute(user.companyId, id, amount, user.id);
    return result;
  }
}
