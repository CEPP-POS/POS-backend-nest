import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Headers,
  Query,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Overview } from './dto/overview.dto';
import { Linegraph } from './dto/linegraph.dto';
import { OrderItemDto } from 'src/employee-side/order/dto/order-item/order-item.dto';
import { CancelOrderTopicDto } from './dto/cancel-orders.dto';

import { IngredientCategoriesDto } from './dto/ingredients-categories.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { EditIngredientDto } from './dto/edit-ingredient.dto';

@Controller('owner')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stock-summary/:date')
  async getStockSummary(
    @Param('date') date: string,
    @Req() request: Request,
  ): Promise<Overview> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    date = date + 'T08:00:00.000Z';
    return this.dashboardService.getStockSummary(
      new Date(date),
      Number(ownerId),
      Number(branchId),
    );
  }

  @Get('stock-sale/:year/:month')
  async getStockLineGraph(
    @Param('year') year: string,
    @Param('month') month: string,
    @Req() request: Request,
  ): Promise<Linegraph> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    return this.dashboardService.getStockLineGraph(
      Number(year),
      Number(month),
      Number(ownerId),
      Number(branchId),
    );
  }

  @Get('stock-orders/:date/:filter')
  async getOrderTopicWithFilter(
    @Param('date') date: string,
    @Param('filter') filter: 'year' | 'month' | 'date' | 'all',
    @Req() request: Request,
  ): Promise<OrderItemDto> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getOrderTopicWithFilter(
      new Date(date),
      filter,
      Number(ownerId),
      Number(branchId),
    );
  }

  @Get('stock-cancel-orders')
  async getCancelOrders(@Req() request: Request): Promise<CancelOrderTopicDto> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getCancelOrders(
      Number(ownerId),
      Number(branchId),
    );
  }

  // edit entity
  @Get('orders/:order_id')
  async getCancelOrderDetails(
    @Param('order_id') order_id: number,
    @Req() request: Request,
  ): Promise<any> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getCancelOrderDetails(
      Number(order_id),
      Number(ownerId),
      Number(branchId),
    );
  }

  @Get('stock-ingredients')
  async getStockIngredients(@Req() request: Request) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getStockIngredients(
      Number(ownerId),
      Number(branchId),
    );
  }

  @Get('stock-ingredients/categories')
  async getIngredientsCategories(
    @Req() request: Request,
  ): Promise<IngredientCategoriesDto> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getIngredientsCategories(
      Number(ownerId),
      Number(branchId),
    );
  }

  @Get('stock-ingredients/:ingredient_id')
  async getIngredientDetails(
    @Param('ingredient_id') ingredient_id: number,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    const ownerId = headers['owner_id'];
    const branchId = headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getIngredientDetails(
      Number(ingredient_id),
      Number(ownerId),
      Number(branchId),
    );
  }

  @Post('stock-group')
  async createStockGroup(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() request: Request,
  ) {
    const owner_id = parseInt(request.headers['owner_id'] as string, 10);
    const branch_id = parseInt(request.headers['branch_id'] as string, 10);

    if (!owner_id || !branch_id) {
      throw new BadRequestException(
        'ต้องระบุ owner_id และ branch_id ใน header',
      );
    }

    return this.dashboardService.createStockGroup(
      createCategoryDto,
      owner_id,
      branch_id,
    );
  }

  @Post('create-stock-ingredients')
  async createIngredient(
    @Req() req: Request,
    @Body() createIngredientDto: CreateIngredientDto,
  ) {
    const ownerId = req.headers['owner_id'];
    const branchId = req.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    return this.dashboardService.createIngredient(
      createIngredientDto,
      ownerIdNum,
      branchIdNum,
    );
  }

  @Patch('update-stock-ingredients/:update_id')
  async updateIngredient(
    @Param('update_id') update_id: number,
    @Headers('owner_id') owner_id: number,
    @Headers('branch_id') branch_id: number,
    @Body() body: UpdateIngredientDto,
  ) {
    if (!owner_id || !branch_id) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    await this.dashboardService.updateIngredient(
      update_id,
      owner_id,
      branch_id,
      body,
    );
    return { message: 'success' };
  }

  @Patch('orders/:order_id')
  async updateCancelStatus(
    @Param('order_id') order_id: number,
    @Body() updateData: { cancel_status: string },
    @Req() request: Request,
  ): Promise<any> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.updateCancelStatus(
      Number(order_id),
      updateData.cancel_status,
      Number(ownerId),
      Number(branchId),
    );
  }

  @Get('stock-ingredients/sub-ingredient/:id')
  async getSubIngredient(
    @Param('id') ingredientId: string,
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
  ) {
    return await this.dashboardService.getSubIngredient(
      parseInt(ingredientId),
      parseInt(ownerId),
      parseInt(branchId),
    );
  }

  @Get('update-stock-ingredients/:update_id')
  async getSubIngredientByID(
    @Param('update_id') update_id: number,
    @Query('owner_id') owner_id: number,
    @Query('branch_id') branch_id: number,
  ) {
    const result = await this.dashboardService.getSubIngredientByID(
      update_id,
      owner_id,
      branch_id,
    );
    if (!result) {
      throw new NotFoundException(
        `Ingredient update with ID ${update_id} not found`,
      );
    }
    return result;
  }

  @Patch('stock-ingredients/:ingredient_id')
  @HttpCode(HttpStatus.OK)
  async deleteIngredient(
    @Param('ingredient_id') ingredient_id: number,
    @Headers() headers: Record<string, string>,
  ) {
    const ownerId = headers['owner_id'];
    const branchId = headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.deleteIngredient(
      ingredient_id,
      Number(ownerId),
      Number(branchId),
    );
  }

  @Patch('edit-stock-ingredients/:ingredient_id')
  async editIngredient(
    @Param('ingredient_id') ingredient_id: number,
    @Body() editIngredientDto: EditIngredientDto,
    @Headers() headers: Record<string, string>,
  ) {
    const ownerId = headers['owner_id'];
    const branchId = headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.editIngredient(
      ingredient_id,
      editIngredientDto,
      Number(ownerId),
      Number(branchId),
    );
  }
}
