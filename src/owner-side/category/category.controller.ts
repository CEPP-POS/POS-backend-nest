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

  // edit entity
  // @Get(':id/menus')
  // async getMenusByCategory(@Param('id') id: number) {
  //   return this.categoryService.getMenusByCategory(id);
  // }

  @Post()
  async create(
    @Req() request: Request,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    const CategoryData = {
      ...createCategoryDto,
      owner_id: ownerIdNum,
      branch_id: branchIdNum,
    };

    return await this.categoryService.create(CategoryData), HttpStatus.CREATED;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.categoryService.remove(+id);
  }

  @Patch(':id')
  async updateCategory(
    @Param('id') categoryId: number,
    @Req() request: Request,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('owner_id and branch_id must be provided in headers');
    }

    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    await this.categoryService.updateCategory(
      categoryId,
      ownerIdNum,
      branchIdNum,
      updateCategoryDto,
    );

    return HttpStatus.OK;
  }
}
