import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { UpdateMenuDto } from './dto/update-menu.dto/update-menu.dto';
import { CreateMenuDto } from './dto/create-menu/create-menu.dto';
import { CreateSweetnessDto } from './dto/create-option/create-sweetness-dto';
import { LinkMenuToStockDto } from './dto/link-stock/link-menu-to-stock.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMenuTypeGroupDto } from './dto/menu-type/create-menu-type-group.dto';
import { UpdateMenuTypeGroupDto } from './dto/menu-type/update-menu-type-group.dto';
import { CreateSizeDto } from './dto/create-option/create-size.dto';
import { CreateAddOnDto } from './dto/create-option/create-add-ons.dto';
import { UpdateSweetnessDto } from './dto/update-option/update-sweetness-dto';
import { UpdateSizeDto } from './dto/update-option/update-size.dto';
import { UpdateAddOnDto } from './dto/update-option/update-add-on.dto';

@Controller('owner/menus')
export class MenuController {
  constructor(
    private readonly menuService: MenuService, // Inject MenuService
  ) {}

  // upload picture to local storage
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.menuService.handleFileUpload(file);
  }

  // * Create a new menu
  @Post()
  async create(@Req() request: Request, @Body() createMenuDto: CreateMenuDto) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    const ownerIdNum = ownerId;
    const branchIdNum = branchId;

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

  @Get('options/add-on')
  async getAddOnDetails(@Req() request: Request) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.menuService.getAddOnDetails(ownerId, branchId);
  }

  // * เรียกดู ชื่อ ID Menu ทั้งหมด
  @Get()
  async findAll(@Req() request: Request) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.menuService.findAll(ownerId, branchId);
  }

  @Post('options/menu_type')
  async createMenuTypeGroup(
    @Body() dto: CreateMenuTypeGroupDto,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];
    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    await this.menuService.createMenuTypeGroup(dto, ownerId, branchId);
    return HttpStatus.CREATED;
  }
  @Delete('options/menu_type/:menuTypeGroupName')
  // @UseGuards(JwtGuard, RolesGuard) // ✅ ต้องใช้ Token และต้องเป็น Owner
  // @Roles('owner')
  async deleteMenuTypeGroup(
    @Param('menuTypeGroupName') menuTypeGroupName: string,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];
    return this.menuService.deleteMenuTypeGroup(
      menuTypeGroupName,
      ownerId,
      branchId,
    );
  }

  @Patch('options/menu_type')
  async updateMenuTypeGroup(
    @Req() request: Request,
    @Body() updateMenuTypeGroupDto: UpdateMenuTypeGroupDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.menuService.updateMenuTypeGroup(
      ownerId,
      branchId,
      updateMenuTypeGroupDto,
    );
  }

  // * Get a single menu
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Get('options/groups')
  async getAllOptionGroups(@Req() request: Request) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.menuService.getAllOptionGroups(ownerId, branchId);
  }

  @Get('options/sweetness/:groupName')
  async getSweetnessGroup(
    @Param('groupName') groupName: string,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.menuService.getGroupData(
      'sweetness',
      groupName,
      ownerId,
      branchId,
    );
  }

  @Get('options/size/:groupName')
  async getSizeGroup(
    @Param('groupName') groupName: string,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.menuService.getGroupData('size', groupName, ownerId, branchId);
  }

  @Get('options/menu-type/:groupName')
  async getMenuTypeGroup(
    @Param('groupName') groupName: string,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.menuService.getGroupData(
      'menu-type',
      groupName,
      ownerId,
      branchId,
    );
  }

  // * Update a menuname description price image
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner_id or branch_id');
    }

    return await this.menuService.update(id, ownerId, branchId, updateMenuDto);
  }

  // * Delete a menu
  @Delete(':id')
  remove(@Req() request: Request, @Param('id') id: string) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];
    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    return this.menuService.remove(id, ownerId, branchId);
  }

  @Post('options/sweetness')
  async createSweetness(
    @Req() request: Request,
    @Body() createSweetnessDto: CreateSweetnessDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    await this.menuService.createSweetness(
      'sweetness',
      createSweetnessDto,
      ownerId,
      ownerId,
    );
  }

  @Patch('options/sweetness')
  async updateSweetness(
    @Req() request: Request,
    @Body() updateSweetnessDto: UpdateSweetnessDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    await this.menuService.updateSweetness(
      'sweetness',
      updateSweetnessDto,
      ownerId,
      branchId,
    );
  }

  @Post('options/size')
  async createSize(
    @Req() request: Request,
    @Body() createSizeDto: CreateSizeDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    await this.menuService.createSize('size', createSizeDto, ownerId, branchId);
  }

  @Post('options/add-ons')
  async createAddOn(
    @Req() request: Request,
    @Body() createAddOnDto: CreateAddOnDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    await this.menuService.createAddOn(
      'addOn',
      createAddOnDto,
      ownerId,
      branchId,
    );
  }

  @Post('stock/:menu_id')
  async linkIngredientToStock(
    @Param('menu_id') menu_id: string,
    @Req() request: Request,
    @Body()
    body: {
      owner_id: number;
      branch_id: number;
      menuData: LinkMenuToStockDto[];
    },
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    return this.menuService.linkIngredientToStock(
      menu_id,
      ownerId,
      branchId,
      body.menuData,
    );
  }

  @Get('/options/:type/:id')
  async findOptionById(@Param('type') type: string, @Param('id') id: string) {
    const menuId = id; //change type str to number
    return this.menuService.findOptionById(type, menuId);
  }

  @Delete('options/size/:sizeGroupName')
  async deleteSizeGroup(
    @Req() request: Request,
    @Param('sizeGroupName') sizeGroupName: string,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    return await this.menuService.deleteSizeGroup(
      sizeGroupName,
      ownerId,
      branchId,
    );
  }

  @Patch('options/size')
  async updateSizeGroup(
    @Req() request: Request,
    @Body() updateSizeDto: UpdateSizeDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    return this.menuService.updateSize(ownerId, branchId, updateSizeDto);
  }

  @Delete('options/add-ons')
  async deleteAllAddOns(@Req() request: Request) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    return this.menuService.deleteAllAddOns(ownerId, branchId);
  }

  @Patch('options/add-ons')
  async updateAddOn(
    @Req() request: Request,
    @Body() updateAddOnDto: UpdateAddOnDto,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    return this.menuService.updateAddOn(ownerId, branchId, updateAddOnDto);
  }

  @Delete('options/sweetness/:sweetness_group_name')
  async deleteSweetness(
    @Param('sweetness_group_name') sweetness_group_name: string,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    return await this.menuService.deleteSweetness(
      sweetness_group_name,
      ownerIdNum,
      branchIdNum,
    );
  }

  @Get('stock/:menu_id')
  async getMenuIngredients(
    @Param('menu_id') menu_id: string,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new Error('Missing required headers: owner-id or branch-id');
    }

    return this.menuService.getMenuIngredients(menu_id, ownerId, branchId);
  }

  @Get('stock/option/:menu_id')
  async getMenuOptions(
    @Param('menu_id') menu_id: number,
    @Req() request: Request,
  ) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.menuService.getMenuOptions(menu_id, +ownerId, +branchId);
  }
}
