import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Req,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category/create-category.dto';
import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';
// import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';

@Controller('owner/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('link-menus')
  async linkMenusToCategory(
    @Req() request: Request,
    @Body() linkMenuToCategoryDto: LinkMenuToCategoryDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new HttpException(
        'Missing required headers: owner_id or branch_id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    const categoryData = {
      ...linkMenuToCategoryDto,
      owner_id: ownerIdNum,
      branch_id: branchIdNum,
    };

    return await this.categoryService.linkMenusToCategory(categoryData);
  }

  @Get('')
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  // edit entity
  // @Get(':id/menus')
  // async getMenusByCategory(@Param('id') id: number) {
  //   return this.categoryService.getMenusByCategory(id);
  // }

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
