import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Overview } from './dto/overview.dto';
import { Linegraph } from './dto/linegraph.dto';
import { OrderItemDto } from 'src/employee-side/order/dto/order-item/order-item.dto';
import { CancelOrderDto, CancelOrderTopicDto } from './dto/cancel-orders.dto';
import { promises } from 'dns';
import { OrderDto } from './dto/cancel-order-details.dto';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientDto } from './dto/ingredients.dto';
import { IngredientCategoriesDto } from './dto/ingredients-categories.dto';

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

  @Get('stock-cancel-orders/:date')
  async getCancelOrders(@Param('date') date: string): Promise<CancelOrderTopicDto> {
    return this.dashboardService.getCancelOrders(new Date(date));
  }

  @Get('orders/:order_id')
  async getCancelOrderDetails(@Param('order_id') order_id: string): Promise<OrderDto>{
    return this.dashboardService.getCancelOrderDetails(Number(order_id));
  }

  @Get('stock-ingredients')
  async getIngredients(): Promise<IngredientDto[]>{
    return this.dashboardService.getIngredients();
  }

  @Get('stock-ingredients/categories')
  async getIngredientsCategories(): Promise<IngredientCategoriesDto>{
    return this.dashboardService.getIngredientsCategories();
  }
}
