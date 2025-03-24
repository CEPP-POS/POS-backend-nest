import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerService } from './owner.service';
import { OwnerController } from './owner.controller';
import { Owner } from '../../entities/owner.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Branch } from 'src/entities/branch.entity';
import { BranchService } from '../branch/branch.service';
import { SizeGroup } from 'src/entities/size-group.entity';
import { Size } from 'src/entities/size.entity';
import { SweetnessLevel } from 'src/entities/sweetness-level.entity';
import { SweetnessGroup } from 'src/entities/sweetness-group.entity';
import { MenuType } from 'src/entities/menu-type.entity';
import { MenuTypeGroup } from 'src/entities/menu-type-group.entity';
import { Menu } from 'src/entities/menu.entity';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';
import { MenuCategory } from 'src/entities/menu_category';
import { AddOn } from 'src/entities/add-on.entity';
import { Category } from 'src/entities/category.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Owner,
      Ingredient,
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
    forwardRef(() => AuthModule),
  ],
  controllers: [OwnerController],
  providers: [OwnerService, BranchService],
  exports: [OwnerService, TypeOrmModule],
})
export class OwnerModule {}
