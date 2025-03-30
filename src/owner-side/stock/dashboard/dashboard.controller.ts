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
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('stock-summary/:date')
  async getStockSummary(
    @Param('date') date: string,
    @Req() request: Request,
  ): Promise<Overview> {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    date = date + 'T08:00:00.000Z';
    return this.dashboardService.getStockSummary(
      new Date(date),
      ownerId,
      branchId,
    );
  }

  @Get('stock-sale/:year/:month')
  async getStockLineGraph(
    @Param('year') year: string,
    @Param('month') month: string,
    @Req() request: Request,
  ): Promise<Linegraph> {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    return this.dashboardService.getStockLineGraph(
      Number(year),
      Number(month),
      ownerId,
      branchId,
    );
  }

  @Get('stock-orders/:date/:filter')
  async getOrderTopicWithFilter(
    @Param('date') date: string,
    @Param('filter') filter: 'year' | 'month' | 'date' | 'all',
    @Req() request: Request,
  ): Promise<OrderItemDto> {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getOrderTopicWithFilter(
      new Date(date),
      filter,
      ownerId,
      branchId,
    );
  }

  @Get('stock-cancel-orders')
  async getCancelOrders(@Req() request: Request): Promise<CancelOrderTopicDto> {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getCancelOrders(ownerId, branchId);
  }

  // edit entity
  @Get('orders/:order_id')
  async getCancelOrderDetails(
    @Param('order_id') order_id: string,
    @Req() request: Request,
  ): Promise<any> {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getCancelOrderDetails(
      order_id,
      ownerId,
      branchId,
    );
  }

  @Get('stock-ingredients')
  async getStockIngredients(@Req() request: Request) {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getStockIngredients(ownerId, branchId);
  }

  @Get('stock-ingredients/categories')
  async getIngredientsCategories(
    @Req() request: Request,
  ): Promise<IngredientCategoriesDto> {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getIngredientsCategories(ownerId, branchId);
  }

  @Get('stock-ingredients/:ingredient_id')
  async getIngredientDetails(
    @Param('ingredient_id') ingredient_id: string,
    @Headers() headers: Record<string, string>,
  ): Promise<any> {
    const ownerId = headers['owner-id'];
    const branchId = headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.getIngredientDetails(
      ingredient_id,
      ownerId,
      branchId,
    );
  }

  @Post('stock-group')
  async createStockGroup(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() request: Request,
  ) {
    const owner_id = request.headers['owner-id'];
    const branch_id = request.headers['branch-id'];

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
    const ownerId = req.headers['owner-id'];
    const branchId = req.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    const ownerIdNum = ownerId;
    const branchIdNum = branchId;

    return this.dashboardService.createIngredient(
      createIngredientDto,
      ownerIdNum,
      branchIdNum,
    );
  }

  @Patch('update-stock-ingredients/:update_id')
  async updateIngredient(
    @Param('update_id') update_id: string,
    @Headers('owner-id') owner_id: string,
    @Headers('branch-id') branch_id: string,
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
    @Param('order_id') order_id: string,
    @Body() updateData: { cancel_status: string },
    @Req() request: Request,
  ): Promise<any> {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.updateCancelStatus(
      order_id,
      updateData.cancel_status,
      ownerId,
      branchId,
    );
  }

  @Get('stock-ingredients/sub-ingredient/:id')
  async getSubIngredient(
    @Param('id') ingredientId: string,
    @Headers('owner-id') ownerId: string,
    @Headers('branch-id') branchId: string,
  ) {
    return await this.dashboardService.getSubIngredient(
      ingredientId,
      ownerId,
      branchId,
    );
  }

  @Get('update-stock-ingredients/:update_id')
  async getSubIngredientByID(
    @Param('update_id') update_id: string,
    @Query('owner_id') owner_id: string,
    @Query('branch_id') branch_id: string,
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
    @Param('ingredient_id') ingredient_id: string,
    @Headers() headers: Record<string, string>,
  ) {
    const ownerId = headers['owner-id'];
    const branchId = headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.dashboardService.deleteIngredient(
      ingredient_id,
      ownerId,
      branchId,
    );
  }

  @Patch('edit-stock-ingredients/:ingredient_id')
  async editIngredient(
    @Param('ingredient_id') ingredient_id: string,
    @Body() editIngredientDto: EditIngredientDto,
    @Headers() headers: Record<string, string>,
  ) {
    const ownerId = headers['owner-id'];
    const branchId = headers['branch-id'];

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
      ownerId,
      branchId,
    );
  }

  @Get('nearly-expired-out')
  async getNearlyExpiredIngredients(@Req() request: Request) {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    return this.dashboardService.getNearlyExpiredAndOutOfStock(
      ownerId,
      branchId,
    );
  }
}
