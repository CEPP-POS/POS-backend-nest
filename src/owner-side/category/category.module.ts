import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { Category } from '../../entities/category.entity';
import { Menu } from 'src/entities/menu.entity';
import { CategoryController } from './category.controller';
import { Owner } from 'src/owner-side/owner/entity/owner.entity';
import { Branch } from 'src/entities/branch.entity';
import { MenuCategory } from 'src/entities/menu_category';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Menu, Owner, Branch, MenuCategory]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService, TypeOrmModule], // ตรวจสอบว่า TypeOrmModule ถูก export
})
export class CategoryModule {}
