import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Overview } from './dto/overview.dto';
import { Linegraph } from './dto/linegraph.dto';
import { OrderItemDto } from 'src/employee-side/order/dto/order-item/order-item.dto';
import { CancelOrderTopicDto } from './dto/cancel-orders.dto';
import { promises } from 'dns';
import { OrderDto } from './dto/cancel-order-details.dto';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientDto } from './dto/ingredients.dto';
import { IngredientCategoriesDto } from './dto/ingredients-categories.dto';
import { IngredientDetailsDto } from './dto/ingredients-details.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ValidationPipe } from '@nestjs/common';
import { create } from 'domain';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpdateCancelStatusDto } from './dto/update-cancel-status.dto';

@Controller('owner')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stock-summary/:date')
  async getStockSummary(@Param('date') date: string): Promise<Overview> {
    date = date + 'T08:00:00.000Z';
    return this.dashboardService.getStockSummary(new Date(date));
  }

  @Get('stock-sale/:date')
  async getStockLineGraph(@Param('date') date: string): Promise<Linegraph> {
    date = date + 'T08:00:00.000Z';
    return this.dashboardService.getStockLineGraph(new Date(date));
  }

  @Get('stock-orders/:date')
  async getOrderTopic(@Param('date') date: string): Promise<OrderItemDto> {
    date = date + 'T08:00:00.000Z';
    return this.dashboardService.getOrderTopic(new Date(date));
  }

  @Get('stock-cancel-orders')
  async getCancelOrders(): Promise<CancelOrderTopicDto> {
    return this.dashboardService.getCancelOrders();
  }

  @Get('orders/:order_id')
  async getCancelOrderDetails(
    @Param('order_id') order_id: number,
  ): Promise<OrderDto> {
    return this.dashboardService.getCancelOrderDetails(Number(order_id));
  }

  @Get('stock-ingredients')
  async getIngredients(): Promise<IngredientDto[]> {
    return this.dashboardService.getIngredients();
  }

  @Get('stock-ingredients/categories')
  async getIngredientsCategories(): Promise<IngredientCategoriesDto> {
    return this.dashboardService.getIngredientsCategories();
  }

  @Get('stock-ingredients/:ingredient_id')
  async getIngredientDetails(
    @Param('ingredient_id') ingredient_id: number,
  ): Promise<IngredientDetailsDto> {
    return this.dashboardService.getIngredientDetails(Number(ingredient_id));
  }

  @Post('stock-group')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.dashboardService.createCategory(createCategoryDto);
  }

  @Post('create-stock-ingredients')
  async createIngredient(@Body() createIngredientDto: CreateIngredientDto) {
    return this.dashboardService.createIngredient(createIngredientDto);
  }

  @Patch('update-stock-ingredients/:ingredient_id')
  async UpdateIngredient(
    @Param('ingredient_id') ingredient_id: number,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ) {
    return this.dashboardService.updateIngredient(
      ingredient_id,
      updateIngredientDto,
    );
  }

  @Patch('orders/:order_id')
  async updateCancelStatus(
    @Param('order_id') order_id: number,
    @Body() updateCancelStatusDto: UpdateCancelStatusDto,
  ) {
    console.log(order_id);
    return this.dashboardService.updateCancelStatus(
      Number(order_id),
      updateCancelStatusDto,
    );
  }
}
