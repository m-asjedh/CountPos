import { IsOptional, IsString } from 'class-validator';

export class ApproveProductDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectProductDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
