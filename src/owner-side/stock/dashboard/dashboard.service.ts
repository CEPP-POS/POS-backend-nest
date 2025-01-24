import { Injectable } from '@nestjs/common';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Overview, TopItemDto } from './dto/overview.dto';
import { SalesSummary } from '../../../entities/sales-summary';
import { Linegraph } from './dto/linegraph.dto';
import { Order } from 'src/entities/order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SalesSummary)
    private readonly salesSummaryRepository: Repository<SalesSummary>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  private async calculateMonthlyRevenue(year: number): Promise<number[]> {
    const monthlyRevenue = Array(12).fill(0);
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const salesSummaries = await this.salesSummaryRepository.find({
        where: {
          date: Between(startOfMonth, endOfMonth),
        },
      });

      monthlyRevenue[month] = salesSummaries.reduce(
        (sum, item) => sum + item.total_revenue,
        0,
      );
    }
    return monthlyRevenue;
  }

  private async calculateDailyStats(date: Date): Promise<{
    totalRevenue: number;
    totalOrders: number;
    canceledOrders: number;
  }> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const salesSummariesForDay = await this.salesSummaryRepository.find({
      where: {
        date: Between(startOfDay, endOfDay),
      },
    });

    return {
      totalRevenue: salesSummariesForDay.reduce(
        (sum, item) => sum + item.total_revenue,
        0,
      ),
      totalOrders: salesSummariesForDay.reduce(
        (sum, item) => sum + item.total_orders,
        0,
      ),
      canceledOrders: salesSummariesForDay.reduce(
        (sum, item) => sum + item.canceled_orders,
        0,
      ),
    };
  }

  async getStockSummary(date: Date): Promise<Overview> {
    const year = date.getFullYear();
    const monthlyRevenue = await this.calculateMonthlyRevenue(year);
    const { totalRevenue, totalOrders, canceledOrders } =
      await this.calculateDailyStats(date);

    const topThree: TopItemDto[] = [
      { name: 'ข้าวมันไก่', count: 50 },
      { name: 'ข้าวไข่เจียว', count: 48 },
      { name: 'ราดหน้า', count: 42 },
    ];

    return {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      canceled_orders: canceledOrders,
      top_three: topThree,
      monthly_revenue: monthlyRevenue,
    };
  }

  async getStockLineGraph(date: Date): Promise<Linegraph> {
    const year = date.getFullYear();
    const monthlyRevenue = await this.calculateMonthlyRevenue(year);
    const { totalRevenue, totalOrders, canceledOrders } =
      await this.calculateDailyStats(date);

    return {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      canceled_orders: canceledOrders,
      monthly_revenue: monthlyRevenue,
    };
  }

  async getOrderTopic(date: Date): Promise<any> {
    // Log the input date
    console.log(date);

    // Query for the total orders and canceled orders
    const salesSummary = await this.salesSummaryRepository.findOne({
      where: { date },
    });

    // Fallback values if no sales summary exists for the given date
    const totalOrders = salesSummary?.total_orders || 0;
    const canceledOrders = salesSummary?.canceled_orders || 0;

    // Query orders and their related items
    const orders = await this.orderRepository.find({
      // where: { order_date: date },
      // relations: ['order_items'], // Ensure you include relations to fetch associated order items
    });

    // Format the orders for the response
    const orderTopic = orders.map((order) => ({
      order_id: order.order_id,
      order_date: order.order_date,
      // quantity: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
      quantity: 1,
      total_amount: order.total_price || 0,
      payment_method: 'Unknown', // Add real logic to fetch payment method if available
    }));

    // Return the formatted response
    return {
      total_order: totalOrders,
      canceled_orders: canceledOrders,
      order_topic: orderTopic,
    };
  }

  
  async getCancelOrders(date: Date){
    const cancelOrderData = [
      {
        order_id: 110234,
        order_date: '02-02-24 เวลา 16:00 น.',
        quantity: 3,
        total_amount: 100,
        payment_method: 'QR CODE',
        cancel_status: 'คืนเงินเสร็จสิ้น',
      },
      {
        order_id: 110235,
        order_date: '02-02-24 เวลา 16:01 น.',
        quantity: 2,
        total_amount: 50,
        payment_method: 'QR CODE',
        cancel_status: 'ยังไม่คืนเงิน',
      },
    ];

    return { cancel_order_topic: cancelOrderData };
  }

  async getCancelOrderDetails(order_id: number){
    const cancelOrderDetails = {
      order_id: 110234,
      order_table: [
        {
          menu_name: 'ชานมไต้หวัน',
          quantity: 1,
          amount: 50,
          category_name: 'โปรสุดคุ้ม',
        },
      ],
      total_amount: 50,
      payment_method: 'QR CODE',
      cancel_status: 'ยังไม่คืนเงิน',
      customer_name: 'พิมลนวย',
      customer_contact: '086-1517-623',
    };

    return cancelOrderDetails; // Return the hardcoded data
  }

  async getIngredients(){
    const ingredients = [
      {
        ingredient_id: 1,
        ingredient_name: 'ไข่มุก',
        net_volume: 250,
        quantity_in_stock: 3,
        total_volume: 100,
        category_id: 1,
        category_name: 'ท็อปปิ้ง',
        expiration_date: new Date('2025-02-01'),
      },
      {
        ingredient_id: 2,
        ingredient_name: 'วุ้นมะพร้าว',
        net_volume: 250,
        quantity_in_stock: 3,
        total_volume: 100,
        category_id: 1,
        category_name: 'ท็อปปิ้ง',
        expiration_date: new Date('2025-02-10'),
      },
    ];

    return ingredients;
  }

  async getIngredientsCategories(){
    const category_id = {
      category_id: 1,
      category_name: 'ท็อปปิ้ง',
    }
    return category_id;
  }

  async getIngredientDetails(ingredient_id: number){
    const IngredientDetails = {
      ingredient_id: 2,
      ingredient_name: 'วุ้นมะพร้าว',
      net_volume: 250,
      quantity_in_stock: 3,
      total_volume: 100,
      category_name: 'ท็อปปิ้ง',

      // Hardcoded Menu Ingredients (as an array)
      menu_ingredients: [
        {
          menu_ingredient_id: 1,
          menu_id: 101,  // Example menu id, linked to Menu table
          ingredient_id: 2,  // Linked to Ingredient table
          size_id: 's',
          level_id: 'หวานน้อย',
          quantity_used: 50,
        },
      ],
    };

    return IngredientDetails;
  }

  async createCategory(createCategoryDto: CreateCategoryDto){
    const newCategory= {
      category_name: createCategoryDto.category_name,  // Create a new category with the provided name
    };
    console.log(newCategory)
    return newCategory;  // Return the newly created category
  }

  async createIngredient(createIngredientDto: CreateIngredientDto){
    const { ingredient_id, ingredient_name, net_volume, quantity_in_stock, total_volume, category_name, expiration_date } = createIngredientDto;
    const newIngredient = {
      ingredient_id,
      ingredient_name,
      net_volume,
      quantity_in_stock,
      total_volume,
      category_name,
      expiration_date,
    };
    return newIngredient;
  }

  async updateIngredient(ingredient_id: number, updateIngredientDto: UpdateIngredientDto){
    const ingredient = []

    if (!ingredient) {
      return { message: `Ingredient with ID ${ingredient_id} not found` };  // Return error message if ingredient not found
    }

    // Update only the fields provided in the DTO
    Object.assign(ingredient, updateIngredientDto);

   
    return ingredient;  // Return the updated ingredient
  }
  }
  
