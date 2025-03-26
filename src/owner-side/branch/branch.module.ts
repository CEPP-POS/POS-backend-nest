import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchService } from './branch.service';
import { Branch } from '../../entities/branch.entity';
import { BranchController } from './branch.controller';
import { OwnerModule } from '../manage-owner/owner.module';
import { OwnerService } from '../manage-owner/owner.service';
import { Size } from '../../entities/size.entity';
import { SizeGroup } from '../../entities/size-group.entity';
import { SweetnessLevel } from '../../entities/sweetness-level.entity';
import { SweetnessGroup } from '../../entities/sweetness-group.entity';
import { MenuType } from '../../entities/menu-type.entity';
import { MenuTypeGroup } from '../../entities/menu-type-group.entity';
import { IngredientCategory } from '../../entities/ingredient-category.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { AddOn } from '../../entities/add-on.entity';
import { Category } from '../../entities/category.entity';
import { Menu } from '../../entities/menu.entity';
import { MenuCategory } from 'src/entities/menu_category';
import { MenuIngredient } from '../../entities/menu-ingredient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      Size,
      SizeGroup,
      SweetnessLevel,
      SweetnessGroup,
      MenuType,
      MenuTypeGroup,
      IngredientCategory,
      Ingredient,
      AddOn,
      Category,
      Menu,
      MenuCategory,
      MenuIngredient,
    ]),
    OwnerModule,
  ],
  controllers: [BranchController],
  providers: [BranchService, OwnerService],
  exports: [BranchService, TypeOrmModule],
})
export class BranchModule {}
