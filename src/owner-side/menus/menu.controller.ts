import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ValidationPipe,
  UsePipes,
  Req,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { UpdateMenuDto } from './dto/update-menu.dto/update-menu.dto';
import { CreateMenuDto } from './dto/create-menu/create-menu.dto';
import { CreateSweetnessDto } from './dto/create-option/Sweetness.dto';
import { LinkMenuToStockDto } from './dto/link-stock/link-menu-to-stock.dto';

@Controller('owner/menus')
export class MenuController {
  constructor(
    private readonly menuService: MenuService, // Inject MenuService
  ) {}

  // * Create a new menu
  @Post()
  async create(@Req() request: Request, @Body() createMenuDto: CreateMenuDto) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    const menuData = {
      ...createMenuDto,
      owner_id: ownerIdNum,
      branch_id: branchIdNum,
    };

    return await this.menuService.create(menuData);
  }

  @Patch('options/:type/:optionId')
  async updateOption(
    @Param('type') type: 'sweetness' | 'add-ons' | 'size' | 'menu-type',
    @Param('optionId') optionId: number,
    @Body() updateOptionDto: any,
  ) {
    return this.menuService.updateOption(type, optionId, updateOptionDto);
  }
  // @Patch('options/:type/:id')
  // async updateOption(
  //   @Param('type') type: 'sweetness' | 'add-ons' | 'size' | 'menu-type',
  //   @Param('id') id: number,
  //   @Body() updateOptionDto: any,
  // ) {
  //   return this.menuService.updateOption(type, id, updateOptionDto);
  // }

  // * เรียกดู ชื่อ ID Menu ทั้งหมด
  @Get()
  async findAll(@Req() request: Request) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];
    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);
    return this.menuService.findAll();
  }

  // * Get a single menu
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(+id);
  }

  @Get('options/:type')
  async getOptions(
    @Param('type') type: 'sweetness' | 'add-ons' | 'size' | 'menu-type',
  ) {
    return this.menuService.getOptions(type);
  }

  // * Update a menu
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    await this.menuService.update(+id, updateMenuDto);
  }

  // * Delete a menu
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(+id);
  }

  @Post('options/sweetness')
  async createSweetness(@Body() createSweetnessDto: CreateSweetnessDto) {
    await this.menuService.createOption('sweetness', createSweetnessDto);
  }

  @Post('options/:type')
  async createOption(
    @Param('type') type: 'sweetness' | 'add-ons' | 'size' | 'menu-type',
    @Body() createOptionDto: any, // ใช้ any สำหรับ add-ons, size, menu-type
  ) {
    if (type === 'sweetness') {
      return this.menuService.createOption(
        type,
        createOptionDto as CreateSweetnessDto,
      );
    }
    // await this.menuService.createOption(type, createOptionDto);
    return await this.menuService.createOption(type, createOptionDto);
  }

  @Patch('stock/:menu_id')
  // @UsePipes(new ValidationPipe({ transform: true }))
  async updateStock(
    @Param('menu_id') menu_id: number,
    @Body()
    body: {
      owner_id: number;
      branch_id: number;
      menuData: LinkMenuToStockDto[];
    },
  ) {
    console.log('menu_id:', menu_id);
    console.log('Request Body:', body);

    return this.menuService.updateStock(
      menu_id,
      body.owner_id,
      body.branch_id,
      body.menuData,
    );
  }

  @Get('/options/:type/:id')
  async findOptionById(@Param('type') type: string, @Param('id') id: string) {
    const menuId = +id; //change type str to number
    return this.menuService.findOptionById(type, menuId);
  }
}
