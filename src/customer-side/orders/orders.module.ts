import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';


@Module({
    imports: [TypeOrmModule.forFeature([])], // Empty for now if no entities

  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
 