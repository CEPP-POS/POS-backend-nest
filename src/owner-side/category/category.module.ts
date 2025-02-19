import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { Category } from '../../entities/category.entity';
import { Menu } from 'src/entities/menu.entity';
import { CategoryController } from './category.controller';
import { MenuCategory } from 'src/entities/menu_category';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Menu, MenuCategory])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService, TypeOrmModule], // ตรวจสอบว่า TypeOrmModule ถูก export
})
export class CategoryModule {}
