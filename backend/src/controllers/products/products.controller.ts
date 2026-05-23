import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { CreateProductDto } from '../../dtos/products/create-product.dto';
import { UpdateProductDto } from '../../dtos/products/update-product.dto';
import { ApproveProductDto, RejectProductDto } from '../../dtos/products/approve-product.dto';
import { CreateProductService } from '../../services/products/create-product.service';
import { GetProductsService } from '../../services/products/get-products.service';
import { UpdateProductService } from '../../services/products/update-product.service';
import { DeleteProductService } from '../../services/products/delete-product.service';
import { ApproveProductService } from '../../services/products/approve-product.service';
import { ImportProductsCsvService } from '../../services/products/import-products-csv.service';
import type { ApprovalStatus } from '@prisma/client';
import { RequestUser } from '../../types/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private createProductService: CreateProductService,
    private getProductsService: GetProductsService,
    private updateProductService: UpdateProductService,
    private deleteProductService: DeleteProductService,
    private approveProductService: ApproveProductService,
    private importProductsCsvService: ImportProductsCsvService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateProductDto) {
    const result = await this.createProductService.execute(user.companyId, dto, user.id, user.role as import('@prisma/client').UserRole);
    return { success: true, data: result, message: 'Product created successfully' };
  }

  @Get()
  async getAll(
    @CurrentUser() user: RequestUser,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') approvalStatus?: ApprovalStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.getProductsService.getAll(user.companyId, {
      search, categoryId, supplierId, approvalStatus, page, limit,
    });
    return { success: true, ...result };
  }

  @Get('pos-search')
  async posSearch(@CurrentUser() user: RequestUser, @Query('q') search?: string) {
    const result = await this.getProductsService.getForPOS(user.companyId, search);
    return { success: true, data: result };
  }

  @Get('pending-approvals')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async getPendingApprovals(@CurrentUser() user: RequestUser) {
    const result = await this.getProductsService.getPendingApprovals(user.companyId);
    return { success: true, data: result };
  }

  @Get(':id')
  async getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.getProductsService.getById(user.companyId, id);
    return { success: true, data: result };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const result = await this.updateProductService.execute(user.companyId, id, dto, user.id);
    return { success: true, data: result, message: 'Product updated successfully' };
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const result = await this.deleteProductService.execute(user.companyId, id, user.id);
    return { success: true, ...result };
  }

  @Post(':id/approve')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async approve(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ApproveProductDto,
  ) {
    const result = await this.approveProductService.approve(user.companyId, id, dto, user.id);
    return { success: true, data: result, message: 'Product approved' };
  }

  @Post(':id/reject')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  async reject(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RejectProductDto,
  ) {
    const result = await this.approveProductService.reject(user.companyId, id, dto, user.id);
    return { success: true, data: result, message: 'Product rejected' };
  }

  @Post('import/csv')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'STAFF')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @CurrentUser() user: RequestUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
  ) {
    const ext = file.originalname?.toLowerCase() ?? '';
    if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      throw new BadRequestException('Only .csv, .xlsx, and .xls files are supported');
    }

    const result = await this.importProductsCsvService.execute(
      user.companyId,
      file.buffer,
      user.id,
      user.role as import('@prisma/client').UserRole,
      file.originalname,
    );
    return {
      success: true,
      data: result,
      message: `Import complete: ${result.created} created, ${result.skipped} skipped`,
    };
  }
}
