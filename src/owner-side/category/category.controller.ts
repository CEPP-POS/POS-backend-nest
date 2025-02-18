import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category/create-category.dto';
// import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';

@Controller('owner/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // @Post('link-menus')
  // async linkMenusToCategory(
  //   @Body() linkMenuToCategoryDto: LinkMenuToCategoryDto,
  // ) {
  //   await this.categoryService.linkMenusToCategory(linkMenuToCategoryDto);
  // }

  @Get('')
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Get(':id/menus')
  async getMenusByCategory(@Param('id') id: number) {
    return this.categoryService.getMenusByCategory(id);
  }

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    await this.categoryService.create(createCategoryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.categoryService.remove(+id);
  }

  @Patch(':id')
  async updateCategory(
    @Param('id') id: number,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    await this.categoryService.updateCategory(id, updateCategoryDto);
  }
}
