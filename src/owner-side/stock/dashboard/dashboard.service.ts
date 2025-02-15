import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Between,
  Equal,
  IsNull,
  MoreThan,
  Not,
  Raw,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Overview, TopItemDto } from './dto/overview.dto';
import { SalesSummary } from '../../../entities/sales-summary';
import { Linegraph } from './dto/linegraph.dto';
import { Order } from 'src/entities/order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { UpdateCancelStatusDto } from './dto/update-cancel-status.dto';
import { Menu } from 'src/entities/menu.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientDto } from './dto/ingredients.dto';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';
import { IngredientUpdate } from 'src/entities/ingredient-update.entity';
import { Owner } from 'src/entities/owner.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';
import {
  IngredientDetailsDto,
  MenuIngredientDto,
} from './dto/ingredients-details.dto';
import { IngredientCategoriesDto } from './dto/ingredients-categories.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SalesSummary)
    private readonly salesSummaryRepository: Repository<SalesSummary>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,

    @InjectRepository(MenuIngredient)
    private menuIngredientRepository: Repository<MenuIngredient>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,

    @InjectRepository(IngredientUpdate)
    private ingredientUpdateRepository: Repository<IngredientUpdate>,

    @InjectRepository(IngredientCategory)
    private ingredientCategoryRepository: Repository<IngredientCategory>,

    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,
  ) { }

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
    top_three: any;
  }> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const salesSummariesForDay = await this.salesSummaryRepository.find({
      where: {
        date: Between(startOfDay, endOfDay),
      },
    });

    const allOrdersForDay = await this.orderRepository.find({
      where: {
        order_date: Between(startOfDay, endOfDay),
      },
      relations: ['order_item', 'order_item.menu'], // Include related order items and menu
    });

    // Flatten the array of order items and aggregate quantities by menu_name
    const items = allOrdersForDay.flatMap((order) =>
      order.order_item.map((item) => ({
        quantity: item.quantity,
        menu_name: item.menu.menu_name,
      })),
    );

    // Aggregate quantities by menu_name
    const aggregatedItems = items.reduce((acc, item) => {
      const existingItem = acc.find((i) => i.menu_name === item.menu_name);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, []);

    // Sort by quantity in descending order and take top 3
    const top3Items = aggregatedItems
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    return {
      top_three: top3Items,
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
    const { top_three, totalRevenue, totalOrders, canceledOrders } =
      await this.calculateDailyStats(date);

    const topThree: TopItemDto[] = top_three;

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
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const salesSummary = await this.salesSummaryRepository.findOne({
      where: {
        date: Between(startOfDay, endOfDay),
      },
    });

    const totalOrders = salesSummary?.total_orders || 0;
    const canceledOrders = salesSummary?.canceled_orders || 0;

    const orders = await this.orderRepository.find({
      where: {
        order_date: Between(startOfDay, endOfDay),
      },
      relations: ['order_item', 'payment'], // Load the related order_items
    });

    const orderTopic = orders.map((order) => {
      // Calculate the total quantity by summing the quantities of the related order items
      const totalQuantity = order.order_item.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const paymentMethod = order.payment
        ? order.payment.payment_method
        : 'Unknown'; // Fallback if no payment exists

      // Return the formatted order details
      return {
        order_id: order.order_id,
        order_date: order.order_date,
        quantity: totalQuantity, // Total quantity of items for the order
        total_amount: order.total_price || 0, // Total price for the order
        payment_method: paymentMethod, // Add logic to fetch payment method if available
      };
    });

    // Return the formatted response
    return {
      total_orders: totalOrders,
      canceled_orders: canceledOrders,
      order_topic: orderTopic,
    };
  }

  async getCancelOrders() {
    const orders = await this.orderRepository.find({
      where: {
        cancel_status: Not(IsNull()),
      },
      relations: ['order_item', 'payment'], // Load the related order_items
    });

    // Create an array to store the formatted order topics
    const orderTopics = orders.map((order) => {
      // Calculate the total quantity by summing the quantities of the related order items
      const totalQuantity = order.order_item.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      // Extract payment method or fallback to 'Unknown' if no payment exists
      const paymentMethod = order.payment
        ? order.payment.payment_method
        : 'Unknown';

      // Return the formatted order details
      return {
        order_id: order.order_id,
        order_date: order.order_date,
        quantity: totalQuantity, // Total quantity of items for the order
        total_amount: order.total_price || 0, // Total price for the order
        payment_method: paymentMethod,
        cancel_order_topic: order.cancel_status,
      };
    });

    // Sort the array with "ยังไม่คืนเงิน" as the first priority, then by date (oldest first)
    orderTopics.sort((a, b) => {
      // Sort by cancel_order_topic ("ยังไม่คืนเงิน" comes first)
      if (
        a.cancel_order_topic === 'ยังไม่คืนเงิน' &&
        b.cancel_order_topic !== 'ยังไม่คืนเงิน'
      ) {
        return -1;
      }
      if (
        a.cancel_order_topic !== 'ยังไม่คืนเงิน' &&
        b.cancel_order_topic === 'ยังไม่คืนเงิน'
      ) {
        return 1;
      }

      // If cancel_order_topic is the same, sort by order_date (ascending)
      return (
        new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
      );
    });

    return orderTopics;
  }

  async getCancelOrderDetails(order_id: number) {
    console.log(order_id);

    const order = await this.orderRepository.findOne({
      where: {
        order_id: order_id,
      },
      relations: [
        'order_item',
        'order_item.menu',
        'order_item.menu.categories',
        'payment',
      ],
    });

    if (!order) {
      throw new Error(`Order with ID ${order_id} not found`);
    }

    const cancelOrderDetails = {
      order_id: order.order_id,
      order_table: order.order_item.map((item) => ({
        menu_name: item.menu?.menu_name || 'N/A',
        quantity: item.quantity,
        amount: item.price,
        category_name: item.menu?.categories?.[0]?.category_name || 'N/A',
      })),
      total_amount: order.payment.amount,
      // total_amount_vat: order.payment.amount * 1.07,
      payment_method: order.payment.payment_method,
      cancel_status: order.cancel_status,
      customer_name: order.customer_name,
      customer_contact: order.customer_contact,
    };

    console.log(cancelOrderDetails);

    return cancelOrderDetails; // Return the hardcoded data
  }

  //TODO
  // ทำอันนี้ๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆๆ TOTTTTTTTTTTTTTT

  async getIngredients(): Promise<IngredientDto[]> {
    const ingredients = await this.ingredientRepository.find({
      relations: ['category_id', 'ingredientUpdate'],
    });

    return ingredients.map((ingredient) => {
      const latestUpdate = ingredient.ingredientUpdate?.[0]; // Assuming first update is latest
      return {
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        net_volume: latestUpdate?.net_volume || 0,
        unit: ingredient.unit || '',
        quantity_in_stock: latestUpdate?.quantity_in_stock || 0,
        total_volume: latestUpdate?.total_volume || 0,
        category_id: ingredient.category_id?.category_id || null,
        category_name: ingredient.category_id?.category_name || '',
        expiration_date: latestUpdate?.expiration_date || null,
      };
    });
  }

  async getIngredientsCategories(): Promise<IngredientCategoriesDto> {
    const categories = await this.ingredientCategoryRepository.find();

    const result: IngredientCategoriesDto = {
      categories: categories.map((category) => ({
        category_id: category.category_id,
        category_name: category.category_name,
      })),
    };

    return result;
  }

  async getIngredientDetails(ingredient_id: number): Promise<any> {
    // Fetch ingredient details
    const ingredient = await this.ingredientRepository.findOne({
      where: { ingredient_id },
      relations: ['category_id'], // Get category details
    });

    if (!ingredient) {
      throw new Error('Ingredient not found');
    }

    // Get today's date (set time to 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all valid ingredient stock updates (not expired, quantity > 0)
    const latestUpdates = await this.ingredientUpdateRepository.find({
      where: {
        ingredient_id: Raw((alias) => `${alias} = ${ingredient_id}`),
        expiration_date: MoreThan(today), // Exclude expired stock
        quantity_in_stock: MoreThan(0), // Exclude empty stock
      },
      order: { expiration_date: 'DESC' }, // Get the latest stock updates
    });

    // Group valid stock data by net_volume
    const groupedStockData: {
      net_volume: number;
      quantity_in_stock: number;
      total_volume: number;
      expiration_date: Date;
    }[] = [];

    latestUpdates.forEach((update) => {
      const existing = groupedStockData.find(
        (item) =>
          item.net_volume === update.net_volume &&
          item.expiration_date.getTime() === update.expiration_date.getTime(),
      );
      if (existing) {
        existing.quantity_in_stock += update.quantity_in_stock;
        existing.total_volume += update.total_volume;
      } else {
        groupedStockData.push({
          net_volume: update.net_volume,
          quantity_in_stock: update.quantity_in_stock,
          total_volume: update.total_volume,
          expiration_date: update.expiration_date,
        });
      }
    });

    // Fetch menu ingredients associated with this ingredient
    const menuIngredients = await this.menuIngredientRepository.find({
      where: { ingredient_id: Raw((alias) => `${alias} = ${ingredient_id}`) },
      relations: ['menu_id', 'menu_id.categories', 'size_id', 'sweetness_id'], // Get related details
    });

    // Transform menu ingredients data
    const menuIngredientsDto = menuIngredients.map((menuIng) => ({
      menu_name: menuIng.menu_id.menu_name,
      size_name: menuIng.size_id.size_name,
      level_name: menuIng.sweetness_id.level_name,
      quantity_used: menuIng.quantity_used,
      unit: ingredient.unit,
      category_name: menuIng.menu_id.categories?.map(cat => cat.category_name).join(', ') || 'Unknown', // Adjust to handle multiple categories
    }));

    // Construct the response
    return {
      ingredient_id: ingredient.ingredient_id,
      ingredient_name: ingredient.ingredient_name,
      category_name: ingredient.category_id?.category_name || 'Unknown',
      stock_data: groupedStockData, // Store grouped stock data (excluding expired/zero quantity)
      menu_ingredients: menuIngredientsDto,
    };
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CreateCategoryDto> {
    const { category_name } = createCategoryDto;
    const existingCategory = await this.ingredientCategoryRepository.findOne({
      where: { category_name },
    });
    if (existingCategory) {
      throw new BadRequestException(
        `Category '${category_name}' มีอยู่แล้วในระบบ`,
      );
    }
    const result =
      await this.ingredientCategoryRepository.insert(createCategoryDto);
    return { category_name: createCategoryDto.category_name };
  }

  async createIngredient(
    createIngredientDto: CreateIngredientDto,
  ): Promise<any> {
    const {
      image_url,
      owner_id,
      ingredient_name,
      net_volume,
      unit,
      quantity_in_stock,
      category_name,
      expiration_date,
    } = createIngredientDto;

    // Find owner
    const owner = await this.ownerRepository.findOne({ where: { owner_id } });

    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    // Find or create category
    let category = await this.ingredientCategoryRepository.findOne({
      where: { category_name },
    });

    if (!category) {
      category = this.ingredientCategoryRepository.create({ category_name });
      await this.ingredientCategoryRepository.save(category);
    }

    // Find existing ingredient
    let ingredient = await this.ingredientRepository
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.owner_id', 'owner')
      .where('ingredient.ingredient_name = :ingredient_name', {
        ingredient_name,
      })
      .andWhere('owner.owner_id = :owner_id', { owner_id })
      .getOne();

    if (!ingredient) {
      // Create new ingredient if not found
      ingredient = this.ingredientRepository.create({
        ingredient_name,
        category_id: category,
        owner_id: owner,
        image_url,
        unit,
      });

      await this.ingredientRepository.save(ingredient);
    }

    // Use QueryBuilder to find existing update
    const existingUpdate = await this.ingredientUpdateRepository
      .createQueryBuilder('update')
      .where('update.ingredient_id = :ingredientId', {
        ingredientId: ingredient.ingredient_id,
      })
      .andWhere('update.net_volume = :netVolume', {
        netVolume: net_volume,
      })
      .andWhere('update.expiration_date = :expirationDate', {
        expirationDate: new Date(expiration_date),
      })
      .getOne();

    if (existingUpdate) {
      // Add quantity and update total volume if the same ingredient exists
      existingUpdate.quantity_in_stock += quantity_in_stock;
      existingUpdate.total_volume += quantity_in_stock * net_volume;

      await this.ingredientUpdateRepository.save(existingUpdate);

      return {
        message: 'Existing ingredient update modified successfully',
        ingredient_id: ingredient.ingredient_id,
        update_id: existingUpdate.update_id,
      };
    } else {
      // Create new ingredient update if no existing record matches
      const total_volume = net_volume * quantity_in_stock;

      const newUpdate = this.ingredientUpdateRepository.create({
        ingredient_id: ingredient,
        quantity_in_stock,
        net_volume,
        total_volume,
        expiration_date: new Date(expiration_date),
      });

      await this.ingredientUpdateRepository.save(newUpdate);

      return {
        message: 'Ingredient and update created successfully',
        ingredient_id: ingredient.ingredient_id,
        update_id: newUpdate.update_id,
      };
    }
  }

  //THISSSSSSsssssssssssssssssssssssssssssssssssssss

  async getUpdateIngredient(ingredient_id: number) {
    const ingredient = await this.ingredientRepository.findOne({
      where: { ingredient_id },
      relations: ['category_id'], // Get category details
    });

    if (!ingredient) {
      throw new Error('Ingredient not found');
    }

    // Get today's date (set time to 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all valid ingredient stock updates (not expired, quantity > 0)
    const latestUpdates = await this.ingredientUpdateRepository.find({
      where: {
        ingredient_id: Raw((alias) => `${alias} = ${ingredient_id}`),
        expiration_date: MoreThan(today), // Exclude expired stock
        quantity_in_stock: MoreThan(0), // Exclude empty stock
      },
      order: { expiration_date: 'DESC' }, // Get the latest stock updates
    });

    // Group valid stock data by net_volume
    const groupedStockData: {
      update_id: number;
      net_volume: number;
      quantity_in_stock: number;
      total_volume: number;
      expiration_date: Date;
    }[] = [];

    latestUpdates.forEach((update) => {
      const existing = groupedStockData.find(
        (item) =>
          item.net_volume === update.net_volume &&
          item.expiration_date.getTime() === update.expiration_date.getTime(),
      );
      if (existing) {
        existing.quantity_in_stock += update.quantity_in_stock;
        existing.total_volume += update.total_volume;
      } else {
        groupedStockData.push({
          update_id: update.update_id,
          quantity_in_stock: update.quantity_in_stock,
          net_volume: update.net_volume,
          total_volume: update.total_volume,
          expiration_date: update.expiration_date,
        });
      }
    });

    // Fetch menu ingredients associated with this ingredient
    const menuIngredients = await this.menuIngredientRepository.find({
      where: { ingredient_id: Raw((alias) => `${alias} = ${ingredient_id}`) },
      relations: ['menu_id', 'menu_id.category', 'size_id', 'sweetness_id'], // Get related details
    });

    // Construct the response
    return {
      ingredient_id: ingredient.ingredient_id,
      ingredient_name: ingredient.ingredient_name,
      category_name: ingredient.category_id?.category_name || 'Unknown',
      stock_data: groupedStockData, // Store grouped stock data (excluding expired/zero quantity)
    };
  }

  async updateIngredient(
    ingredient_id: number,
    updateIngredientDto: UpdateIngredientDto[],
  ) {
    const updatedIngredients = [];

    for (const update of updateIngredientDto) {
      const ingredientUpdate = await this.ingredientUpdateRepository.findOne({
        where: {
          ingredient_id: Raw((alias) => `${alias} = ${ingredient_id}`),
          update_id: update.update_id,
        },
      });

      if (!ingredientUpdate) {
        console.log(`No ingredient found with update_id ${update.update_id}`);
        continue;
      }

      // Apply updates only for provided fields
      if (update.quantity_in_stock !== undefined) {
        ingredientUpdate.quantity_in_stock = update.quantity_in_stock;
      }
      if (update.total_volume !== undefined) {
        ingredientUpdate.total_volume = update.total_volume;
      }
      if (update.net_volume !== undefined) {
        ingredientUpdate.net_volume = update.net_volume;
      }
      if (update.expiration_date !== undefined) {
        ingredientUpdate.expiration_date = new Date(update.expiration_date);
      }

      // Save updated ingredient record
      await this.ingredientUpdateRepository.save(ingredientUpdate);
      updatedIngredients.push(ingredientUpdate);
    }

    return { updatedIngredients };
  }

  async updateCancelStatus(
    order_id: number,
    updateCancelStatusDto: UpdateCancelStatusDto,
  ) {
    // Extract cancel_status from the DTO
    const { cancel_status } = updateCancelStatusDto;

    // Find the order by ID
    const order = await this.orderRepository.findOne({ where: { order_id } });

    // If no order is found, throw an exception
    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    // Update the cancel_status
    order.cancel_status = cancel_status;

    // Save the updated order to the database
    await this.orderRepository.save(order);

    return order;
  }
}
