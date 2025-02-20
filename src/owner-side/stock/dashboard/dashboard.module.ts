import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SalesSummary } from '../../../entities/sales-summary.entity';
import { Order } from 'src/entities/order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Menu } from 'src/entities/menu.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';
import { IngredientUpdate } from 'src/entities/ingredient-update.entity';
import { Owner } from 'src/owner-side/owner/entity/owner.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesSummary,
      Order,
      OrderItem,
      Menu,
      Ingredient,
      IngredientCategory,
      IngredientUpdate,
      Owner,
      MenuIngredient,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
