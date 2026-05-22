import { IsString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryLogType } from '@prisma/client';

export class StockAdjustmentDto {
  @IsString()
  productId: string;

  @IsEnum(InventoryLogType)
  type: InventoryLogType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
