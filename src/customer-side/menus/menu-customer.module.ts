import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCustomerController } from './menu-customer.controller';
import { MenuCustomerService } from './menu-customer.service';
import { Menu } from 'src/entities/menu.entity';
import { Category } from 'src/entities/category.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';
import { MenuType } from 'src/entities/menu-type.entity';
import { MenuTypeGroup } from 'src/entities/menu-type-group.entity';
import { SweetnessLevel } from 'src/entities/sweetness-level.entity';
import { Size } from 'src/entities/size.entity';
import { SweetnessGroup } from 'src/entities/sweetness-group.entity';
import { SizeGroup } from 'src/entities/size-group.entity';
import { AddOn } from 'src/entities/add-on.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { MenuCategory } from 'src/entities/menu_category';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Menu,
      MenuCategory,
      Category,
      MenuIngredient,
      MenuType,
      MenuTypeGroup,
      SweetnessLevel,
      Size,
      SweetnessGroup,
      SizeGroup,
      AddOn,
      Ingredient,
    ]),
  ],
  controllers: [MenuCustomerController],
  providers: [MenuCustomerService],
})
export class MenuCustomerModule {}
