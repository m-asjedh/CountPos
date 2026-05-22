import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsController } from './products.controller';
import { CreateProductService } from '../../services/products/create-product.service';
import { GetProductsService } from '../../services/products/get-products.service';
import { UpdateProductService } from '../../services/products/update-product.service';
import { DeleteProductService } from '../../services/products/delete-product.service';
import { ApproveProductService } from '../../services/products/approve-product.service';
import { ImportProductsCsvService } from '../../services/products/import-products-csv.service';

@Module({
  imports: [MulterModule.register({ storage: memoryStorage() })],
  controllers: [ProductsController],
  providers: [
    CreateProductService,
    GetProductsService,
    UpdateProductService,
    DeleteProductService,
    ApproveProductService,
    ImportProductsCsvService,
  ],
})
export class ProductsModule {}
