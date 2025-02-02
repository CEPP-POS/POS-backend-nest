import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { MenuType } from 'src/entities/menu-type.entity';
import { Size } from 'src/entities/size.entity';
import { SweetnessLevel } from 'src/entities/sweetness-level.entity';
import { Menu } from 'src/entities/menu.entity';
import { AddOn } from 'src/entities/add-on.entity';
import { Owner } from 'src/entities/owner.entity';
import { Branch } from 'src/entities/branch.entity';
import { Payment } from 'src/entities/payment.entity';
import { SalesSummary } from 'src/entities/sales-summary';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      SalesSummary,
      OrderItem,
      Owner,
      Branch,
      AddOn, // ✅ ต้องเพิ่ม AddOn เข้าไปที่นี่
      Menu,
      SweetnessLevel,
      Size,
      MenuType,
      Payment
    ]),
  ],

  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule { }
