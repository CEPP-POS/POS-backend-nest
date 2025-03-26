import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Equal, MoreThan } from 'typeorm';
import { Order } from '../../entities/order.entity';
import {
  CancelStatus,
  CreateOrderDto,
} from './dto/create-order/create-order.dto';
import { UpdateOrderDto } from './dto/update-order/update-order.dto';
import { CancelOrderDto } from './dto/cancel-order/Cancel-order.dto';
import { OrderItem } from '../../entities/order-item.entity';

import { AddOn } from 'src/entities/add-on.entity';
import { Menu } from 'src/entities/menu.entity';
import { SweetnessLevel } from 'src/entities/sweetness-level.entity';
import { Size } from 'src/entities/size.entity';
import { MenuType } from 'src/entities/menu-type.entity';
import { OrderItemDto } from './dto/order-item/order-item.dto';

import { Branch } from 'src/entities/branch.entity';
import { Owner } from 'src/entities/owner.entity';
import { PayWithCashDto } from './dto/pay-with-cash/pay-with-cash.dto';
import { Payment } from 'src/entities/payment.entity';
import { SalesSummary } from 'src/entities/sales-summary.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';
import { IngredientUpdate } from 'src/entities/ingredient-update.entity';
import { OrderItemAddOn } from 'src/entities/order-item-add-on.entity';
import { PaymentMethod } from './dto/create-order/create-order.dto';
import { Ingredient } from 'src/entities/ingredient.entity';
import { spawn } from 'child_process';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(OrderItemAddOn)
    private readonly orderItemAddOnRepository: Repository<OrderItemAddOn>,

    @InjectRepository(AddOn)
    private readonly addOnRepository: Repository<AddOn>,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(SweetnessLevel)
    private readonly sweetnessRepository: Repository<SweetnessLevel>,

    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,

    @InjectRepository(MenuType)
    private readonly menuTypeRepository: Repository<MenuType>,
    @InjectRepository(SalesSummary)
    private readonly salesSummaryRepository: Repository<SalesSummary>,

    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(MenuIngredient)
    private readonly menuIngredientRepository: Repository<MenuIngredient>,
    @InjectRepository(IngredientUpdate)
    private readonly ingredientUpdateRepository: Repository<IngredientUpdate>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      order: {
        order_id: 'ASC',
        queue_number: 'ASC', // เรียงตามหมายเลขคิวจากน้อยไปมาก
        order_date: 'DESC', // เรียงตามวันที่ (ล่าสุดก่อน)
      },
    });
  }

  async findOne(id: string): Promise<Order | undefined> {
    return this.orderRepository.findOneBy({ order_id: id });
  }

  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order | undefined> {
    const order = await this.findOne(id.toString());
    if (!order) {
      return undefined;
    }
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async getOrderDetails(order_id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    return order;
  }

  async remove(id: number): Promise<void> {
    const result = await this.orderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }

  async cancelOrder(
    orderId: string,
    cancelOrderDto: CancelOrderDto,
    owner_id: string,
    branch_id: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId, owner: { owner_id }, branch: { branch_id } },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with order_id ${orderId} or owner_id ${owner_id} or ${branch_id} not found`,
      );
    }

    // ตรวจสอบสถานะ หากคำสั่งซื้อชำระเงินแล้ว
    if (order.status === 'paid' || order.status === 'รอทำ') {
      order.status = 'canceled';
      order.customer_name = cancelOrderDto.customer_name;
      order.customer_contact = cancelOrderDto.contact;
      order.cancel_status = CancelStatus.RefundPending;
    } else {
      throw new Error('Cannot cancel an unpaid order');
    }

    return await this.orderRepository.save(order);
  }

  async updateIngredientStock(
    menuId: string,
    sizeId: string,
    orderQuantity: number,
    orderDate: any,
    addOnIds: string[] = [],
    menuTypeId: string,
  ) {
    const addOnIngredients = await this.addOnRepository.find({
      where: {
        add_on_id: In(addOnIds),
      },
      relations: {
        ingredient: true, // เพิ่ม relations เพื่อให้เข้าถึง ingredient ได้
      },
    });

    const ingredientIds = addOnIngredients.map(
      (addon) => addon.ingredient.ingredient_id,
    );
    console.log(ingredientIds);
    // 1. Find all ingredients for the menu menu_type and size combination
    const menuIngredients = await this.menuIngredientRepository.find({
      where: [
        {
          menu: Equal(menuId),
          size: Equal(sizeId),
          is_addon: false,
          menu_type: Equal(menuTypeId),
        },
        {
          menu: Equal(menuId),
          ingredient: In(ingredientIds),
          is_addon: true,
        },
      ],
      relations: {
        ingredient: true,
        menu: true,
        size: true,
        menu_type: true,
      },
    });

    // Process each ingredient
    for (const menuIngredient of menuIngredients) {
      if (!menuIngredient.ingredient) {
        console.warn(
          `No ingredient found for menu ingredient ${menuIngredient.menu_ingredient_id}`,
        );
        continue;
      }

      const totalNeeded = menuIngredient.quantity_used * orderQuantity;

      // 2. Get all ingredient updates sorted by expiration date
      const ingredientUpdates = await this.ingredientUpdateRepository.find({
        where: {
          ingredient: Equal(menuIngredient.ingredient.ingredient_id),
          expiration_date: MoreThan(orderDate),
        },
        order: {
          expiration_date: 'ASC',
        },
      });

      let remainingToProcess = totalNeeded;

      // Process each ingredient update record
      for (const update of ingredientUpdates) {
        if (remainingToProcess <= 0) break;

        const currentAvailableVolume = update.total_volume;
        const volumeToDeduct = Math.min(
          remainingToProcess,
          currentAvailableVolume,
        );
        const stockThreshold =
          update.net_volume * (update.quantity_in_stock - 1);

        // Calculate new total volume after deduction
        const newTotalVolume = currentAvailableVolume - volumeToDeduct;

        if (newTotalVolume <= stockThreshold) {
          // Update quantity if threshold is reached
          update.quantity_in_stock -= 1;
          update.total_volume = update.quantity_in_stock * update.net_volume;
        } else {
          update.total_volume = newTotalVolume;
        }

        remainingToProcess -= volumeToDeduct;

        await this.ingredientUpdateRepository.save(update);
      }

      if (remainingToProcess > 0) {
        console.warn(
          `Insufficient stock for ingredient ${menuIngredient.ingredient.ingredient_id}`,
        );
        // You might want to throw an error here or handle this case differently
      }
    }
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
    items: OrderItemDto[],
    owner_id: string,
    branch_id: string,
  ): Promise<any> {
    // Verify owner and branch
    const owner = await this.ownerRepository.findOne({
      where: { owner_id },
    });

    const branch = await this.branchRepository.findOne({
      where: { branch_id, owner: { owner_id } },
    });

    if (!owner || !branch) {
      throw new NotFoundException('Invalid owner or branch');
    }

    // Convert order_date to Date if it's a string
    if (typeof createOrderDto.order_date === 'string') {
      const parsedDate = new Date(createOrderDto.order_date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }
      createOrderDto.order_date = parsedDate;
    }

    // Calculate start and end of the day for comparison
    const orderDate = new Date(createOrderDto.order_date);
    const startOfDay = new Date(orderDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(orderDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find the latest queue number for the current day
    const latestOrder = await this.orderRepository.findOne({
      where: {
        order_date: Between(startOfDay, endOfDay),
        branch: { branch_id },
        owner: { owner_id },
      },
      order: {
        queue_number: 'DESC',
      },
    });

    // Set queue number to latest + 1 or 1 if no orders exist for today
    createOrderDto.queue_number = latestOrder
      ? latestOrder.queue_number + 1
      : 1;

    // ค้นหา sales summary สำหรับวันนี้
    let salesSummary = await this.salesSummaryRepository.findOne({
      where: {
        date: Between(startOfDay, endOfDay),
        owner: { owner_id },
        branch: { branch_id },
      },
    });

    // ถ้าไม่มี sales summary สำหรับวันนี้ ให้สร้างใหม่
    if (!salesSummary) {
      salesSummary = this.salesSummaryRepository.create({
        sales_summary_id: createOrderDto.sales_summary_id || uuidv4(),
        date: startOfDay,
        total_revenue: createOrderDto.total_price,
        total_orders: 1,
        canceled_orders: createOrderDto.cancel_status ? 1 : 0,
        owner,
        branch,
      });
    } else {
      // อัพเดทข้อมูลที่มีอยู่
      salesSummary.total_revenue += createOrderDto.total_price;
      salesSummary.total_orders += 1;
      if (createOrderDto.cancel_status) {
        salesSummary.canceled_orders += 1;
      }
    }

    // บันทึก sales summary
    await this.salesSummaryRepository.save(salesSummary);

    // Proceed to create the order
    const newOrder = this.orderRepository.create({
      order_id: createOrderDto.order_id || uuidv4(),
      ...createOrderDto,
      is_paid: false,
      cancel_status: createOrderDto.cancel_status || null,
      owner,
      branch,
    });

    const savedOrder = await this.orderRepository.save(newOrder);

    // คำนวณ total_amount รวม VAT 7%
    const totalAmount = createOrderDto.total_price * 1.07;

    // สร้าง payment record ตามวิธีการชำระเงิน
    const payment = this.paymentRepository.create({
      payment_id: createOrderDto.payment_id || uuidv4(),
      order: savedOrder,
      payment_method: createOrderDto.payment_method,
      status:
        createOrderDto.payment_method === PaymentMethod.CASH
          ? 'cash'
          : 'pending',
      path_img: createOrderDto.path_img,
      amount: createOrderDto.total_price,
      total_amount: totalAmount,
      payment_date: new Date(),
      owner,
      branch,
      ...(createOrderDto.payment_method === PaymentMethod.CASH && {
        cash_given: createOrderDto.cash_given,
        change: createOrderDto.change,
      }),
    });

    await this.paymentRepository.save(payment);

    // ถ้าเป็นการชำระเงินสด ให้อัพเดทสถานะ order เป็น paid ทันที
    if (createOrderDto.payment_method === PaymentMethod.CASH) {
      savedOrder.status = 'รอทำ';
      savedOrder.is_paid = true;
      if (savedOrder.cancel_status !== null) {
        savedOrder.is_paid = false;
      }
      await this.orderRepository.save(savedOrder);
    }

    await Promise.all(
      items.map(async (item) => {
        const menu = await this.menuRepository.findOne({
          where: {
            menu_id: item.menu_id,
            owner: { owner_id },
            branch: { branch_id },
          },
        });

        const sweetness = await this.sweetnessRepository.findOne({
          where: {
            sweetness_id: item.sweetness_id,
            owner: { owner_id },
            branch: { branch_id },
          },
        });

        const size = await this.sizeRepository.findOne({
          where: {
            size_id: item.size_id,
            owner: { owner_id },
            branch: { branch_id },
          },
        });

        const menuType = await this.menuTypeRepository.findOne({
          where: {
            menu_type_id: item.menu_type_id,
            owner: { owner_id },
            branch: { branch_id },
          },
        });

        if (!menu || !sweetness || !size || !menuType) {
          throw new NotFoundException(
            'One or more order item components not found',
          );
        }

        try {
          await this.updateIngredientStock(
            item.menu_id,
            item.size_id,
            item.quantity,
            savedOrder.order_date,
            item.add_on_id,
            item.menu_type_id,
          );
        } catch (error) {
          console.error(`Failed to update ingredient stock: ${error.message}`);
          throw error;
        }
        // console.log(orderItems);
        // Create order item first
        const orderItem = this.orderItemRepository.create({
          order_item_id: item.order_item_id || uuidv4(),
          quantity: item.quantity,
          price: item.price,
          menu,
          sweetnessLevel: sweetness,
          size,
          menuType,
          owner,
          branch,
          order: savedOrder,
        });

        const savedOrderItem = await this.orderItemRepository.save(orderItem);

        // Create order item add-ons with reference to saved order item
        const orderItemAddOns = await Promise.all(
          item.add_on_id.map(async (addon_id) => {
            const ingredient = await this.ingredientRepository.findOne({
              where: { ingredient_id: addon_id },
            });

            if (!ingredient) {
              throw new NotFoundException(
                `Ingredient with ID ${addon_id} not found`,
              );
            }

            const addon = this.orderItemAddOnRepository.create({
              order_item_id: savedOrderItem.order_item_id,
              ingredient_id: addon_id,
              owner,
              branch,
            });
            const savedAddon = await this.orderItemAddOnRepository.save(addon);

            return {
              ...savedAddon,
              ingredient_name: ingredient.ingredient_name,
            };
          }),
        );

        return {
          ...savedOrderItem,
          orderItem: orderItemAddOns,
        };
      }),
    );

    return this.findOrderById(savedOrder.order_id);
  }
  async findAllOrders(
    owner_id: string,
    branch_id: string,
  ): Promise<{
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    orders: any[];
  }> {
    const totalOrders = await this.orderRepository.count({
      where: { owner: { owner_id }, branch: { branch_id } },
    });

    const pendingOrders = await this.orderRepository.count({
      where: { owner: { owner_id }, branch: { branch_id }, status: 'รอทำ' },
    });

    const completedOrders = await this.orderRepository.count({
      where: {
        owner: { owner_id },
        branch: { branch_id },
        status: 'เสร็จสิ้น',
      },
    });

    const orders = await this.orderRepository.find({
      where: { owner: { owner_id }, branch: { branch_id } },
      relations: [
        'order_item',
        'order_item.menu',
        'order_item.sweetnessLevel',
        'order_item.size',
        'order_item.menuType',
        'order_item.orderItem',
        'order_item.orderItem.ingredient',
      ],
      select: {
        order_id: true,
        order_date: true,
        queue_number: true,
        status: true,
        cancel_status: true,
      },
    });
    const formattedOrders = orders.map((order) => ({
      ...order,
      order_item: order.order_item.map((item) => ({
        menu_name: {
          menu_id: item.menu.menu_id,
          menu_name: item.menu.menu_name,
          quantity: item.quantity,
        },
        add_ons: item.orderItem
          ? item.orderItem.map((addon) => ({
              ingredient_id: addon.ingredient.ingredient_id,
              ingredient_name: addon.ingredient.ingredient_name,
            }))
          : [],
        details: [
          item.sweetnessLevel
            ? {
                sweetness_id: item.sweetnessLevel.sweetness_id,
                level_name: item.sweetnessLevel.level_name,
              }
            : null,
          item.size
            ? { size_id: item.size.size_id, size_name: item.size.size_name }
            : null,
          item.menuType
            ? {
                menu_type_id: item.menuType.menu_type_id,
                type_name: item.menuType.type_name,
              }
            : null,
        ].filter(Boolean),
      })),
    }));

    return {
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      completed_orders: completedOrders,
      orders: formattedOrders,
    };
  }

  async findOrderById(order_id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id },
      relations: [
        'order_item',
        'order_item.menu',
        'order_item.sweetnessLevel',
        'order_item.size',
        'order_item.orderItem',
        'order_item.orderItem.ingredient',
        'order_item.menuType',
        'branch',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    // Create a deep copy and transform
    const { branch, ...orderWithoutBranch } = order;
    const transformedOrder = {
      branch_name: branch?.branch_name,
      ...orderWithoutBranch,
      order_item: order.order_item.map((item) => ({
        ...item,
        orderItem: item.orderItem
          ? item.orderItem.map((addon) => ({
              order_item_id: addon.order_item_id,
              ingredient_id: addon.ingredient_id,
              ingredient_name: addon.ingredient?.ingredient_name,
            }))
          : [],
      })),
    };

    // Generate receipt image
    try {
      await new Promise((resolve, reject) => {
        console.log('Starting Python process...');
        // แก้ไข path ให้ชี้ไปที่ src แทน dist
        const pythonPath = path.join(
          process.cwd(),
          'src',
          'utils',
          'slip_image.py',
        );
        console.log('Python script path:', pythonPath);

        const pythonProcess = spawn('python', [
          pythonPath,
          JSON.stringify(transformedOrder),
        ]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
          console.log('Python output:', data.toString());
          outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          console.error('Python error:', data.toString());
          errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
          console.log(`Python process exited with code ${code}`);
          if (code === 0) {
            const lines = outputData.trim().split('\n');
            const image_path = lines[lines.length - 1]; // Get the last line
            transformedOrder['receipt_image_path'] = image_path;
            resolve(image_path);
          } else {
            reject(new Error(`Python process failed: ${errorData}`));
          }
        });

        pythonProcess.on('error', (error) => {
          console.error('Failed to start Python process:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to generate receipt image:', error);
    }

    return transformedOrder as any;
  }

  async completeOrder(
    order_id: string,
    owner_id: string,
    branch_id: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id: order_id, owner: { owner_id }, branch: { branch_id } },
    });
    if (!order) {
      throw new NotFoundException(
        `Order with ID ${order_id} or owner_id ${owner_id} or branch_id ${branch_id} not found`,
      );
    }

    if (order.status === 'paid' || order.status === 'รอทำ') {
      order.status = 'เสร็จสิ้น';
    } else {
      throw new Error('ออร์เดอร์อาจเสร็จสิ้นไปแล้ว');
    }

    return await this.orderRepository.save(order);
  }

  async payWithCash(
    order_id: string,
    payWithCashDto: PayWithCashDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id: order_id },
      relations: ['owner', 'branch'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    let payment = await this.paymentRepository.findOne({
      where: { order: { order_id: order_id } },
    });

    // คำนวณ total_amount รวม VAT 7%
    const totalAmount = payWithCashDto.amount * 1.07;

    if (!payment) {
      // If no payment exists, create a new one
      payment = this.paymentRepository.create({
        payment_id: payWithCashDto.payment_id || uuidv4(),
        order,
        cash_given: payWithCashDto.cash_given,
        change: payWithCashDto.change,
        payment_method: 'CASH',
        status: 'cash',
        payment_date: new Date(),
        amount: payWithCashDto.amount,
        total_amount: totalAmount,
        owner: order.owner,
        branch: order.branch,
      });
    } else {
      // Update the existing payment
      Object.assign(payment, {
        cash_given: payWithCashDto.cash_given,
        change: payWithCashDto.change,
        payment_method: 'CASH',
        status: 'cash',
        payment_date: new Date(),
        amount: payWithCashDto.amount,
        total_amount: totalAmount,
        owner: order.owner,
        branch: order.branch,
      });
    }

    // Save payment
    await this.paymentRepository.save(payment);

    // Update order status
    order.status = 'paid';
    await this.orderRepository.save(order);

    return this.orderRepository.findOne({
      where: { order_id: order_id },
      relations: ['owner', 'branch'],
    });
  }

  // เพิ่มฟังก์ชันสำหรับอัพเดทสถานะการชำระเงิน
  async updatePaymentStatus(
    order_id: string,
    status: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { order: { order_id } },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${order_id} not found`);
    }

    payment.status = status;

    // ถ้าชำระเงินสำเร็จ อัพเดทสถานะ order ด้วย
    if (status === 'success') {
      payment.order.status = 'paid';
      await this.orderRepository.save(payment.order);
    }

    return this.paymentRepository.save(payment);
  }

  async getLatestOrder(
    owner_id: string,
    branch_id: string,
  ): Promise<{ order_id: string; queue_number: number }> {
    const latestOrder = await this.orderRepository.findOne({
      where: {
        owner: { owner_id },
        branch: { branch_id },
      },
      order: {
        order_date: 'DESC', // Get the latest order by order_date
      },
    });

    if (!latestOrder) {
      throw new NotFoundException(
        'No orders found for the specified owner and branch',
      );
    }

    return {
      order_id: latestOrder.order_id,
      queue_number: latestOrder.queue_number,
    };
  }
}
