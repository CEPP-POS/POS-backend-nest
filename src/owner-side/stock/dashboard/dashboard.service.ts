import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, IsNull, MoreThan, Not, Raw, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Overview, TopItemDto } from './dto/overview.dto';
import { SalesSummary } from '../../../entities/sales-summary.entity';
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
// import {
//   IngredientDetailsDto,
//   MenuIngredientDto,
// } from './dto/ingredients-details.dto';
import { IngredientCategoriesDto } from './dto/ingredients-categories.dto';
import { Branch } from 'src/entities/branch.entity';
import { CancelStatus } from 'src/employee-side/order/dto/create-order/create-order.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SalesSummary)
    private readonly salesSummaryRepository: Repository<SalesSummary>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

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
  ) {}

  private async calculateMonthlyRevenue(
    year: number,
    ownerId: number,
    branchId: number,
  ): Promise<number[]> {
    const monthlyRevenue = Array(12).fill(0);
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const salesSummaries = await this.salesSummaryRepository.find({
        where: {
          date: Between(startOfMonth, endOfMonth),
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
      });

      monthlyRevenue[month] = salesSummaries.reduce(
        (sum, item) => sum + item.total_revenue,
        0,
      );
    }
    return monthlyRevenue;
  }

  private async calculateDailyStats(
    date: Date,
    ownerId: number,
    branchId: number,
  ): Promise<{
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
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
    });

    const allOrdersForDay = await this.orderRepository.find({
      where: {
        order_date: Between(startOfDay, endOfDay),
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['order_item', 'order_item.menu'],
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

  async getStockSummary(
    date: Date,
    ownerId: number,
    branchId: number,
  ): Promise<Overview> {
    const year = date.getFullYear();
    const monthlyRevenue = await this.calculateMonthlyRevenue(
      year,
      ownerId,
      branchId,
    );
    const { top_three, totalRevenue, totalOrders, canceledOrders } =
      await this.calculateDailyStats(date, ownerId, branchId);

    const topThree: TopItemDto[] = top_three;

    return {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      canceled_orders: canceledOrders,
      top_three: topThree,
      monthly_revenue: monthlyRevenue,
    };
  }

  async getStockLineGraph(
    date: Date,
    ownerId: number,
    branchId: number,
  ): Promise<Linegraph> {
    const year = date.getFullYear();
    const monthlyRevenue = await this.calculateMonthlyRevenue(
      year,
      ownerId,
      branchId,
    );
    const { totalRevenue, totalOrders, canceledOrders } =
      await this.calculateDailyStats(date, ownerId, branchId);

    return {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      canceled_orders: canceledOrders,
      monthly_revenue: monthlyRevenue,
    };
  }

  // Entity order total price
  async getOrderTopic(
    date: Date,
    ownerId: number,
    branchId: number,
  ): Promise<any> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const salesSummary = await this.salesSummaryRepository.findOne({
      where: {
        date: Between(startOfDay, endOfDay),
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
    });

    const totalOrders = salesSummary?.total_orders || 0;
    const canceledOrders = salesSummary?.canceled_orders || 0;

    const orders = await this.orderRepository.find({
      where: {
        order_date: Between(startOfDay, endOfDay),
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['order_item', 'payment'],
    });

    const orderTopic = orders.map((order) => {
      const totalQuantity = order.order_item.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const paymentMethod = order.payment
        ? order.payment.payment_method
        : 'Unknown';

      const amount = order.payment.amount;
      const total_amount = order.payment.total_amount;
      const cancel_status = order.cancel_status;

      return {
        order_id: order.order_id,
        order_date: order.order_date,
        quantity: totalQuantity,
        amount: amount,
        total_amount: total_amount,
        payment_method: paymentMethod,
        cancel_status: cancel_status,
      };
    });

    return {
      total_orders: totalOrders,
      canceled_orders: canceledOrders,
      order_topic: orderTopic,
    };
  }

  // ENTITY ORDER TOTAL PRICE
  async getCancelOrders(ownerId: number, branchId: number) {
    const orders = await this.orderRepository.find({
      where: {
        cancel_status: Not(IsNull()),
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['order_item', 'payment'],
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
      const amount = order.payment.amount;
      const total_amount = order.payment.total_amount;
      const cancel_status = order.cancel_status;

      // Return the formatted order details
      return {
        order_id: order.order_id,
        order_date: order.order_date,
        quantity: totalQuantity,
        amount: amount,
        total_amount: total_amount,
        payment_method: paymentMethod,
        cancel_status: cancel_status,
      };
    });

    // Sort the array with "ยังไม่คืนเงิน" as the first priority, then by date (oldest first)
    orderTopics.sort((a, b) => {
      // Sort by cancel_order_topic ("ยังไม่คืนเงิน" comes first)
      if (
        a.cancel_status === 'ยังไม่คืนเงิน' &&
        b.cancel_status !== 'ยังไม่คืนเงิน'
      ) {
        return -1;
      }
      if (
        a.cancel_status !== 'ยังไม่คืนเงิน' &&
        b.cancel_status === 'ยังไม่คืนเงิน'
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

  async getCancelOrderDetails(
    order_id: number,
    ownerId: number,
    branchId: number,
  ) {
    const order = await this.orderRepository.findOne({
      where: {
        order_id: order_id,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: [
        'order_item',
        'order_item.menu',
        'order_item.size',
        'order_item.sweetnessLevel',
        'order_item.orderItem',
        'order_item.orderItem.ingredient',
        'order_item.menu.menuCategory',
        'order_item.menu.menuCategory.category',
        'payment',
      ],
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${order_id} not found for this owner and branch`,
      );
    }

    const cancelOrderDetails = {
      order_id: order.order_id,
      order_date: order.order_date,
      order_table: order.order_item.map((item) => ({
        menu_name: item.menu?.menu_name || 'N/A',
        quantity: item.quantity,
        amount: item.price,
        size_name: item.size?.size_name || 'N/A',
        sweetness_name: item.sweetnessLevel?.level_name || 'N/A',
        add_on_name:
          item.orderItem?.map((addOn) => addOn.ingredient?.ingredient_name) ||
          'N/A',
        category_name:
          item.menu?.menuCategory?.map((cat) => cat.category.category_name) ||
          'N/A',
      })),
      total_amount: order.payment?.amount || 0,
      payment_method: order.payment?.payment_method || 'N/A',
      cancel_status: order.cancel_status,
      customer_name: order.customer_name,
      customer_contact: order.customer_contact,
    };

    return cancelOrderDetails;
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
        category_id:
          ingredient.ingredientCategory?.ingredient_category_id || null,
        category_name:
          ingredient.ingredientCategory?.ingredient_category_name || '',
        expiration_date: latestUpdate?.expiration_date || null,
      };
    });
  }
  async getIngredientsCategories(
    owner_id: number,
    branch_id: number,
  ): Promise<IngredientCategoriesDto> {
    const categories = await this.ingredientCategoryRepository.find({
      where: {
        owner: { owner_id },
        branch: { branch_id },
      },
    });

    return {
      categories: categories.map((category) => ({
        category_id: category.ingredient_category_id,
        category_name: category.ingredient_category_name,
      })),
    };
  }

  async getIngredientDetails(
    ingredient_id: number,
    owner_id: number,
    branch_id: number,
  ): Promise<any> {
    const ingredient = await this.ingredientRepository.findOne({
      where: {
        ingredient_id,
        owner: { owner_id },
        branch: { branch_id },
      },
      relations: ['ingredientCategory', 'owner', 'branch'], // เพิ่ม owner และ branch ใน relations
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingredient ID ${ingredient_id} not found`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validStockData = await this.ingredientUpdateRepository.findOne({
      where: {
        ingredient: { ingredient_id },
        expiration_date: MoreThan(today),
        quantity_in_stock: MoreThan(0),
      },
      order: { expiration_date: 'ASC' }, // เปลี่ยนเป็น 'ASC'
    });

    let stock_data = []; // Initialize stock_data as an empty array

    if (validStockData) {
      // Check if validStockData exists
      stock_data = [
        {
          net_volume: validStockData.net_volume,
          quantity_in_stock: validStockData.quantity_in_stock,
          total_volume: validStockData.total_volume,
          expiration_date: validStockData.expiration_date
            .toISOString()
            .split('T')[0],
        },
      ];
    }

    const menuIngredients = await this.menuIngredientRepository.find({
      where: { ingredient: { ingredient_id } },
      relations: [
        'menu',
        'menu.menuCategory',
        'menu.menuCategory.category',
        'size',
        'menu_type',
      ],
    });

    const menu_ingredients = menuIngredients.map((menuIng) => ({
      menu_name: menuIng.menu.menu_name,
      size_name: menuIng.size ? menuIng.size.size_name : null,
      level_name: menuIng.menu_type ? menuIng.menu_type.type_name : null,
      quantity_used: menuIng.quantity_used,
      unit: ingredient.unit,
      category_name:
        menuIng.menu.menuCategory.length > 0
          ? menuIng.menu.menuCategory
              .map((cat) => cat.category.category_name)
              .join(', ')
          : 'Unknown',
    }));

    return {
      ingredient_id: ingredient.ingredient_id,
      ingredient_name: ingredient.ingredient_name,
      category_name: ingredient.ingredientCategory
        ? ingredient.ingredientCategory.ingredient_category_name
        : 'Unknown',
      stock_data,
      menu_ingredients,
    };
  }

  async createStockGroup(
    createCategoryDto: CreateCategoryDto,
    owner_id: number,
    branch_id: number,
  ): Promise<any> {
    const { category_name } = createCategoryDto;

    const existingCategory = await this.ingredientCategoryRepository.findOne({
      where: {
        ingredient_category_name: category_name,
        owner: { owner_id },
        branch: { branch_id },
      },
    });

    if (existingCategory) {
      throw new BadRequestException(`หมวดหมู่ '${category_name}' มีอยู่แล้ว`);
    }

    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner)
      throw new BadRequestException(`Owner ID ${owner_id} ไม่พบในระบบ`);

    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });
    if (!branch)
      throw new BadRequestException(`Branch ID ${branch_id} ไม่พบในระบบ`);

    const newCategory = this.ingredientCategoryRepository.create({
      ingredient_category_name: category_name,
      owner,
      branch,
    });

    await this.ingredientCategoryRepository.save(newCategory);

    return {
      message: 'สร้างหมวดหมู่สำเร็จ',
      category_name: category_name,
      owner_id: owner_id,
      branch_id: branch_id,
    };
  }

  async createIngredient(
    createIngredientDto: CreateIngredientDto,
    owner_id: number,
    branch_id: number,
  ): Promise<any> {
    const {
      image_url,
      ingredient_name,
      net_volume,
      unit,
      quantity_in_stock,
      category_name,
      expiration_date,
    } = createIngredientDto;

    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branch_id} not found`);
    }

    let category = await this.ingredientCategoryRepository.findOne({
      where: { ingredient_category_name: category_name },
    });

    if (!category) {
      category = this.ingredientCategoryRepository.create({
        ingredient_category_name: category_name,
        owner,
        branch,
      });
      await this.ingredientCategoryRepository.save(category);
    }

    let ingredient = await this.ingredientRepository.findOne({
      where: { ingredient_name, owner: { owner_id }, branch: { branch_id } },
    });

    if (!ingredient) {
      ingredient = this.ingredientRepository.create({
        ingredient_name,
        ingredientCategory: category,
        owner,
        branch,
        image_url,
        unit,
      });

      await this.ingredientRepository.save(ingredient);
    }

    const existingUpdate = await this.ingredientUpdateRepository.findOne({
      where: {
        ingredient: { ingredient_id: ingredient.ingredient_id },
        net_volume: net_volume,
        expiration_date: new Date(expiration_date),
      },
    });

    if (existingUpdate) {
      existingUpdate.quantity_in_stock += quantity_in_stock;
      existingUpdate.total_volume += net_volume * quantity_in_stock;

      await this.ingredientUpdateRepository.save(existingUpdate);

      return {
        message: 'Stock updated successfully',
        ingredient_id: ingredient.ingredient_id,
        update_id: existingUpdate.update_id,
        total_volume: existingUpdate.total_volume,
      };
    } else {
      const total_volume = net_volume * quantity_in_stock;

      const newUpdate = this.ingredientUpdateRepository.create({
        ingredient: ingredient,
        quantity_in_stock,
        net_volume,
        total_volume,
        expiration_date: new Date(expiration_date),
        owner,
        branch,
      });

      await this.ingredientUpdateRepository.save(newUpdate);

      return {
        message: 'Ingredient created successfully',
        ingredient_id: ingredient.ingredient_id,
        update_id: newUpdate.update_id,
        total_volume: newUpdate.total_volume,
      };
    }
  }

  async updateIngredient(
    update_id: number,
    owner_id: number,
    branch_id: number,
    updateIngredientDto: UpdateIngredientDto,
  ) {
    console.log(`🔍 Checking update_id: ${update_id}`);

    const ingredientUpdate = await this.ingredientUpdateRepository.findOne({
      where: {
        update_id: update_id,
        owner: { owner_id },
        branch: { branch_id },
      },
      relations: ['ingredient'],
    });

    console.log(' Found Ingredient Update:', ingredientUpdate);

    if (!ingredientUpdate) {
      throw new NotFoundException(
        ` No ingredient update found with update_id ${update_id}`,
      );
    }

    const ingredient = await this.ingredientRepository.findOne({
      where: {
        ingredient_id: ingredientUpdate.ingredient.ingredient_id,
        owner: { owner_id },
        branch: { branch_id },
      },
      relations: ['ingredientCategory'],
    });

    console.log(' Found Ingredient:', ingredient);

    if (!ingredient) {
      throw new NotFoundException(
        ` Ingredient ID ${ingredientUpdate.ingredient.ingredient_id} not found for this owner/branch`,
      );
    }

    const old_quantity = ingredientUpdate.quantity_in_stock;
    const old_net_volume = ingredientUpdate.net_volume;
    const old_total_volume = ingredientUpdate.total_volume;

    console.log(
      ` Old Data - quantity: ${old_quantity}, net_volume: ${old_net_volume}, total_volume: ${old_total_volume}`,
    );

    const new_quantity =
      updateIngredientDto.quantity_in_stock !== undefined
        ? updateIngredientDto.quantity_in_stock
        : old_quantity;

    const new_net_volume =
      updateIngredientDto.net_volume !== undefined
        ? updateIngredientDto.net_volume
        : old_net_volume;

    let new_total_volume = old_total_volume;

    if (
      updateIngredientDto.total_volume !== undefined &&
      new_quantity === old_quantity &&
      new_net_volume === old_net_volume
    ) {
      new_total_volume = updateIngredientDto.total_volume;
    } else {
      new_total_volume = new_quantity * new_net_volume;
    }

    console.log(
      ` New Data - quantity: ${new_quantity}, net_volume: ${new_net_volume}, total_volume: ${new_total_volume}`,
    );

    ingredientUpdate.quantity_in_stock = new_quantity;
    ingredientUpdate.net_volume = new_net_volume;
    ingredientUpdate.total_volume = new_total_volume;

    if (updateIngredientDto.expiration_date !== undefined) {
      ingredientUpdate.expiration_date = new Date(
        updateIngredientDto.expiration_date,
      );
    }

    await this.ingredientUpdateRepository.save(ingredientUpdate);
    console.log(' Update successful!');

    return {
      ingredient_id: ingredient.ingredient_id,
      category_name: ingredient.ingredientCategory
        ? ingredient.ingredientCategory.ingredient_category_name
        : 'Unknown',
      ingredient_name: ingredient.ingredient_name,
      update_id: ingredientUpdate.update_id,
      quantity: ingredientUpdate.quantity_in_stock,
      net_volume: ingredientUpdate.net_volume,
      total_volume: ingredientUpdate.total_volume,
      expiration_date: ingredientUpdate.expiration_date
        .toISOString()
        .split('T')[0],
      unit: ingredient.unit,
    };
  }

  async updateCancelStatus(
    order_id: number,
    cancel_status: string,
    ownerId: number,
    branchId: number,
  ) {
    const order = await this.orderRepository.findOne({
      where: {
        order_id: order_id,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['payment'], // เพิ่ม relation กับ payment
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID ${order_id} not found for this owner and branch`,
      );
    }

    // ถ้าสถานะเป็น "คืนเงินเสร็จสิ้น" ให้หักยอดเงินออกจาก sales_summary
    if (cancel_status === 'คืนเงินเสร็จสิ้น') {
      const orderDate = new Date(order.order_date);
      const startOfDay = new Date(orderDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(orderDate.setHours(23, 59, 59, 999));

      // หา sales_summary ของวันที่สั่งออเดอร์
      const salesSummary = await this.salesSummaryRepository.findOne({
        where: {
          date: Between(startOfDay, endOfDay),
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
      });

      if (salesSummary) {
        // หักยอดเงินออกจาก total_revenue
        salesSummary.total_revenue -= order.payment.amount;
        await this.salesSummaryRepository.save(salesSummary);
      }
    }

    order.cancel_status = cancel_status as CancelStatus;
    return await this.orderRepository.save(order);
  }

  async getStockIngredients(ownerId: number, branchId: number) {
    const ingredients = await this.ingredientRepository.find({
      where: {
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
        is_delete: false,
      },
      relations: ['ingredientCategory', 'ingredientUpdate'],
      order: {
        ingredient_name: 'ASC',
      },
    });

    const today = new Date();
    console.log(ingredients);

    // สร้าง Map เพื่อจัดกลุ่มตาม category
    const categoryMap = new Map();

    ingredients.forEach((ingredient) => {
      console.log('Processing ingredient:', ingredient.ingredient_name);

      const validUpdates = ingredient.ingredientUpdate.filter((update) => {
        const isValid =
          update.quantity_in_stock > 0 &&
          new Date(update.expiration_date) > today;
        console.log('Update valid?', isValid, 'for:', {
          quantity_in_stock: update.quantity_in_stock,
          net_volume: update.net_volume,
          total_volume: update.total_volume,
          expiration_date: update.expiration_date,
        });
        return isValid;
      });

      const totalNetVolume = validUpdates.reduce((sum, update) => {
        console.log('Adding to net_volume sum:', update.net_volume);
        return sum + update.net_volume;
      }, 0);

      const totalVolume = validUpdates.reduce((sum, update) => {
        console.log('Adding to total_volume sum:', update.total_volume);
        return sum + update.total_volume;
      }, 0);

      console.log('Total net volume:', totalNetVolume);
      console.log('Total volume:', totalVolume);

      const categoryId =
        ingredient.ingredientCategory?.ingredient_category_id || null;
      const categoryName =
        ingredient.ingredientCategory?.ingredient_category_name ||
        'ไม่ระบุหมวดหมู่';

      // ถ้ายังไม่มี category นี้ใน Map ให้สร้างใหม่
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          category_name: categoryName,
          ingredients: [],
        });
      }

      // เพิ่ม ingredient เข้าไปใน array ของ category นั้นๆ
      categoryMap.get(categoryId).ingredients.push({
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        net_volume: totalNetVolume > 0 ? totalNetVolume : 0,
        total_volume: totalVolume > 0 ? totalVolume : 0,
        unit: ingredient.unit,
      });
    });

    // แปลง Map เป็น Array แล้วส่งกลับ
    return Array.from(categoryMap.values());
  }

  async getSubIngredient(
    ingredient_id: number,
    ownerId: number,
    branchId: number,
  ) {
    const ingredient = await this.ingredientRepository.findOne({
      where: {
        ingredient_id: ingredient_id,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['ingredientUpdate'],
    });

    if (!ingredient) {
      throw new NotFoundException('ไม่พบข้อมูลวัตถุดิบ');
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // กรองและจัดเรียงข้อมูลจาก relation แทนการ query ใหม่
    const validUpdates = ingredient.ingredientUpdate
      .filter(
        (update) =>
          update.quantity_in_stock > 0 &&
          new Date(update.expiration_date) > today,
      )
      .sort(
        (a, b) =>
          new Date(a.expiration_date).getTime() -
          new Date(b.expiration_date).getTime(),
      );

    return {
      ingredient_id: ingredient.ingredient_id,
      ingredient_name: ingredient.ingredient_name,
      updates: validUpdates.map((update) => ({
        update_id: update.update_id,
        quantity_in_stock: update.quantity_in_stock,
        total_volume: update.total_volume,
        net_volume: update.net_volume,
        expiration_date: update.expiration_date,
      })),
    };
  }

  async getSubIngredientByID(
    update_id: number,
    ownerId: number,
    branchId: number,
  ) {
    const ingredientUpdate = await this.ingredientUpdateRepository.findOne({
      where: {
        update_id: update_id,
        ingredient: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
      },
      relations: ['ingredient', 'ingredient.ingredientCategory'], // ดึง ingredient และ ingredient_category
    });

    if (!ingredientUpdate) {
      throw new NotFoundException('ไม่พบข้อมูลวัตถุดิบ');
    }

    const ingredient = ingredientUpdate.ingredient;

    return {
      ingredient_id: ingredient.ingredient_id,
      category_name: ingredient.ingredientCategory
        ? ingredient.ingredientCategory.ingredient_category_name
        : 'Unknown',
      ingredient_name: ingredient.ingredient_name,
      update_id: ingredientUpdate.update_id,
      quantity: ingredientUpdate.quantity_in_stock,
      net_volume: ingredientUpdate.net_volume,
      total_volume: ingredientUpdate.total_volume,
      expiration_date: ingredientUpdate.expiration_date
        .toISOString()
        .split('T')[0],
      unit: ingredient.unit,
    };
  }
}
