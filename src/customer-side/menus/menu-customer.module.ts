import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCustomerService } from './menu-customer.service';
import { MenuCustomerController } from './menu-customer.controller';
import { Menu } from 'src/entities/menu.entity';
import { Category } from 'src/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, Category])],
  controllers: [MenuCustomerController],
  providers: [MenuCustomerService],
})
export class MenuCustomerModule {}
