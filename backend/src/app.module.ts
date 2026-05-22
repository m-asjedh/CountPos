import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthModule } from './controllers/auth/auth.module';
import { UsersModule } from './controllers/users/users.module';
import { CompaniesModule } from './controllers/companies/companies.module';
import { ProductsModule } from './controllers/products/products.module';
import { CategoriesModule } from './controllers/categories/categories.module';
import { SuppliersModule } from './controllers/suppliers/suppliers.module';
import { CustomersModule } from './controllers/customers/customers.module';
import { InvoicesModule } from './controllers/invoices/invoices.module';
import { InventoryModule } from './controllers/inventory/inventory.module';
import { DashboardModule } from './controllers/dashboard/dashboard.module';
import { ReportsModule } from './controllers/reports/reports.module';
import { NotificationsModule } from './controllers/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ProductsModule,
    CategoriesModule,
    SuppliersModule,
    CustomersModule,
    InvoicesModule,
    InventoryModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
