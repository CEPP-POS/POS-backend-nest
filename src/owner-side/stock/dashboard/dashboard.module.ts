import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SalesSummary } from '../../../entities/sales-summary';
import { Order } from 'src/entities/order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Menu } from 'src/entities/menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalesSummary, Order, OrderItem, Menu])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
