import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { OrderModule } from './employee-side/order/order.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { OwnerModule } from './owner-side/owner/owner.module';
import { MenuModule } from './owner-side/menus/menu.module';
import { CategoryModule } from './owner-side/category/category.module';
import { BranchModule } from './owner-side/branch/branch.module';
import { DashboardModule } from './owner-side/stock/dashboard/dashboard.module';
import { IngredientModule } from './owner-side/ingredient/ingredient.module';
import { PauseModule } from './employee-side/pause/pause.module';
import { MenuCustomerModule } from './customer-side/menus/menu-customer.module';
import { MinioModule } from './minio/minio.module';
import { ImageModule } from './images/image.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    BranchModule,
    CategoryModule,
    DashboardModule,
    ImageModule,
    IngredientModule,
    MenuCustomerModule,
    MenuModule,
    CategoryModule,
    DashboardModule,
    ImageModule,
    IngredientModule,
    PauseModule,
    MinioModule,
    OrderModule,
    OwnerModule,
    PauseModule,
  ],
})
export class AppModule {}
