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
  async create(@Body() createMenuDto: CreateMenuDto) {
    await this.menuService.create(createMenuDto);
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

  // * Get all menus
  @HttpCode(200)
  @Get()
  findAll() {
    return this.menuService.findAll();
  }

  // @Patch('options/:type/:id')
  // async updateOption(
  //   @Param('type') type: 'sweetness' | 'add-ons' | 'size' | 'menu-type',
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() updateOptionDto: any,
  // ) {
  //   await this.menuService.updateOption(type, id, updateOptionDto);
  // }

  // // * ดึงข้อมูล Size Group ตาม ID (เผื่อใช้งานในอนาคต)
  // @Get('size-group/:id')
  // findSizeGroupById(@Param('id') id: number) {
  //   return this.menuService.findSizeGroupById(id);
  // }

  // @Post('options/size-group')
  // async createSizeGroup(
  //   @Body()
  //   body: {
  //     group_name: string;
  //     sizes: { name: string; price: number }[];
  //     menu_ids: number[];
  //   },
  // ) {
  //   return this.menuService.createSizeGroup(
  //     body.group_name,
  //     body.sizes,
  //     body.menu_ids,
  //   );
  // }

  // * Link options to a menu
  // @Post('options/:type/link/:menu_id/:option_id')
  // linkOptionToMenu(
  //   @Param('type') type: 'sweetness' | 'size' | 'add-ons' | 'menu-type',
  //   @Param('menu_id') menu_id: number[],
  //   @Param('option_id') option_id: number,
  // ) {
  //   return this.menuService.linkOptionToMenu(menu_id, type, option_id);
  // }

  // @Post('options/:type/link/:menu_id/:option_id')
  // linkOptionToMenu(
  //   @Param('type') type: 'sweetness' | 'size' | 'add-ons' | 'menu-type',
  //   @Param('menu_id') menu_id: number[], // Accept menu_id as a string
  //   @Param('option_id') option_id: number,
  // ) {
  //   // Convert the comma-separated string of menu_ids into an array of numbers

  //   return this.menuService.linkOptionToMenu(menuId, type, option_id);
  // }

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
    await this.menuService.createOption(type, createOptionDto);
    return this.menuService.createOption(type, createOptionDto);
  }

  @Post('stock/:menu_id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateStock(
    @Param('menu_id') menu_id: number,
    @Body()
    body: {
      data: {
        owner_id: number;
        branch_id: number;
        menuData: LinkMenuToStockDto[];
      };
    },
  ) {
    const { owner_id, branch_id, menuData } = body.data;
    if (!Array.isArray(menuData)) {
      throw new Error('menuData is not an array');
    }
    return this.menuService.updateStock(menu_id, owner_id, branch_id, menuData);
  }
}
