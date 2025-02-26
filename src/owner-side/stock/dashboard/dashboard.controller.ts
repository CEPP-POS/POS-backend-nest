import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Overview } from './dto/overview.dto';
import { Linegraph } from './dto/linegraph.dto';
import { OrderItemDto } from 'src/employee-side/order/dto/order-item/order-item.dto';
import { CancelOrderTopicDto } from './dto/cancel-orders.dto';

import { IngredientDto } from './dto/ingredients.dto';
import { IngredientCategoriesDto } from './dto/ingredients-categories.dto';
import { IngredientDetailsDto } from './dto/ingredients-details.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpdateCancelStatusDto } from './dto/update-cancel-status.dto';

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

  @Get('stock-sale/:date')
  async getStockLineGraph(
    @Param('date') date: string,
    @Req() request: Request,
  ): Promise<Linegraph> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    date = date + 'T08:00:00.000Z';
    return this.dashboardService.getStockLineGraph(
      new Date(date),
      Number(ownerId),
      Number(branchId),
    );
  }

  @Get('stock-orders/:date')
  async getOrderTopic(
    @Param('date') date: string,
    @Req() request: Request,
  ): Promise<OrderItemDto> {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    date = date + 'T08:00:00.000Z';
    return this.dashboardService.getOrderTopic(
      new Date(date),
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
  // @Get('orders/:order_id')
  // async getCancelOrderDetails(
  //   @Param('order_id') order_id: number,
  // ): Promise<OrderDto> {
  //   return this.dashboardService.getCancelOrderDetails(Number(order_id));
  // }

  @Get('stock-ingredients')
  async getIngredients(): Promise<IngredientDto[]> {
    return this.dashboardService.getIngredients();
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
  ): Promise<IngredientDetailsDto> {
    return this.dashboardService.getIngredientDetails(Number(ingredient_id));
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

  @Get('update-stock-ingredients/:ingredient_id')
  async getUpdateIngredient(
    @Param('ingredient_id') ingredient_id: number,
  ): Promise<any> {
    return this.dashboardService.getUpdateIngredient(Number(ingredient_id));
  }

  @Patch('update-stock-ingredients/:ingredient_id')
  async updateIngredient(
    @Param('ingredient_id') ingredient_id: number,
    @Body() body: { updates: UpdateIngredientDto[] },
  ) {
    console.log('Received body:', body); // Add this log to inspect the request body
    return this.dashboardService.updateIngredient(
      ingredient_id,
      body.updates, // Pass the array to the service
    );
  }

  @Patch('orders/:order_id')
  async updateCancelStatus(
    @Param('order_id') order_id: number,
    @Body() updateCancelStatusDto: UpdateCancelStatusDto,
  ) {
    return this.dashboardService.updateCancelStatus(
      Number(order_id),
      updateCancelStatusDto,
    );
  }
}
