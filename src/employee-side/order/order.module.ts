import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from '../../entities/order.entity';
import { SalesSummary } from 'src/entities/sales-summary';
import { OrderItem } from '../../entities/order-item.entity';
import { Owner } from 'src/entities/owner.entity';
import { Branch } from 'src/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, SalesSummary, OrderItem, Owner, Branch])],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule { }
