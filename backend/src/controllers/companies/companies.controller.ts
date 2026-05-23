import { Controller, Get, Patch, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RequestUser } from '../../types/auth.types';

class UpdateCompanyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() logoUrl?: string;
}

class UpdateSettingsDto {
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() currencySymbol?: string;
  @IsOptional() @IsBoolean() taxEnabled?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) taxRate?: number;
  @IsOptional() @IsString() taxLabel?: string;
  @IsOptional() @IsString() invoicePrefix?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) lowStockThreshold?: number;
  @IsOptional() @IsBoolean() requireApproval?: boolean;
  @IsOptional() @IsBoolean() allowStaffDiscount?: boolean;
  @IsOptional() @IsString() receiptFooter?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() dateFormat?: string;
  @IsOptional() @IsString() priceCodeWord?: string;
  @IsOptional() @IsString() priceCodeDigits?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private prisma: PrismaService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: RequestUser) {
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      include: { settings: true },
    });
    return { success: true, data: company };
  }

  @Patch('profile')
  @Roles('OWNER', 'ADMIN')
  async updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateCompanyDto) {
    const updated = await this.prisma.company.update({
      where: { id: user.companyId },
      data: dto,
    });
    return { success: true, data: updated, message: 'Company profile updated' };
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: RequestUser) {
    const settings = await this.prisma.companySettings.findUnique({
      where: { companyId: user.companyId },
    });
    return { success: true, data: settings };
  }

  @Patch('settings')
  @Roles('OWNER', 'ADMIN')
  async updateSettings(@CurrentUser() user: RequestUser, @Body() dto: UpdateSettingsDto) {
    if (dto.priceCodeWord !== undefined || dto.priceCodeDigits !== undefined) {
      const word = (dto.priceCodeWord ?? '').trim().toUpperCase();
      const digits = (dto.priceCodeDigits ?? '').trim();
      if (word || digits) {
        if (!word || !digits) {
          throw new BadRequestException('Both price code word and digits are required when using price codes');
        }
        if (word.length !== digits.length) {
          throw new BadRequestException(
            `Price code word and digits must be the same length (${word.length} vs ${digits.length})`,
          );
        }
        if (!/^[A-Z]+$/.test(word)) {
          throw new BadRequestException('Price code word must contain only letters A–Z');
        }
        if (!/^\d+$/.test(digits)) {
          throw new BadRequestException('Price code digits must contain only numbers 0–9');
        }
      }
    }

    const updated = await this.prisma.companySettings.update({
      where: { companyId: user.companyId },
      data: {
        ...dto,
        priceCodeWord: dto.priceCodeWord?.trim().toUpperCase() || null,
        priceCodeDigits: dto.priceCodeDigits?.trim() || null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: 'SETTINGS_CHANGE',
        entity: 'CompanySettings',
        entityId: user.companyId,
        description: 'Company settings updated',
      },
    });

    return { success: true, data: updated, message: 'Settings updated' };
  }

  @Get('audit-logs')
  @Roles('OWNER', 'ADMIN')
  async getAuditLogs(@CurrentUser() user: RequestUser) {
    const logs = await this.prisma.auditLog.findMany({
      where: { companyId: user.companyId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { success: true, data: logs };
  }
}
