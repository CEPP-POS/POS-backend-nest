import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Equal, MoreThan } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { CreateOrderDto } from './dto/create-order/create-order.dto';
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
import { Owner } from 'src/owner-side/owner/entity/owner.entity';
import { PayWithCashDto } from './dto/pay-with-cash/pay-with-cash.dto';
import { Payment } from 'src/entities/payment.entity';
import { SalesSummary } from 'src/entities/sales-summary.entity';
import { CompleteOrderDto } from './dto/complete-order/complete-order.dto';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';
import { IngredientUpdate } from 'src/entities/ingredient-update.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

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
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const owner = await this.ownerRepository.findOne({
      where: { owner_id: 1 },
    });
    const branch = await this.branchRepository.findOne({
      where: { branch_id: 1 },
    });

    // Convert order_date to Date if it's a string
    if (typeof createOrderDto.order_date === 'string') {
      const parsedDate = new Date(createOrderDto.order_date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }
      createOrderDto.order_date = parsedDate;
    }

    // Calculate start and end of the day for comparison
    const orderDateOnly = new Date(
      createOrderDto.order_date.toISOString().split('T')[0],
    );
    const startOfDay = new Date(orderDateOnly.setHours(0, 0, 0, 0));
    const endOfDay = new Date(orderDateOnly.setHours(23, 59, 59, 999));

    let salesSummary = await this.salesSummaryRepository.findOne({
      where: {
        date: Between(startOfDay, endOfDay),
      },
    });

    if (salesSummary) {
      // Update total revenue and orders
      salesSummary.total_revenue += createOrderDto.total_price;
      salesSummary.total_orders += 1;
      if (createOrderDto.cancel_status === null) {
        salesSummary.canceled_orders += 1;
      }
      await this.salesSummaryRepository.save(salesSummary);
    } else {
      salesSummary = this.salesSummaryRepository.create({
        date: orderDateOnly,
        total_revenue: createOrderDto.total_price,
        total_orders: 1,
        canceled_orders: createOrderDto.cancel_status === null ? 0 : 1,
        owner: owner,
        branch: branch,
      });
      await this.salesSummaryRepository.save(salesSummary);
    }

    // Proceed to create the order
    const newOrder = this.orderRepository.create(createOrderDto);
    console.log(newOrder.order_date);
    return this.orderRepository.save(newOrder);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      order: {
        order_id: 'ASC',
        queue_number: 'ASC', // เรียงตามหมายเลขคิวจากน้อยไปมาก
        order_date: 'DESC', // เรียงตามวันที่ (ล่าสุดก่อน)
      },
    });
  }

  async findOne(id: number): Promise<Order | undefined> {
    return this.orderRepository.findOneBy({ order_id: id });
  }

  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order | undefined> {
    const order = await this.findOne(id);
    if (!order) {
      return undefined;
    }
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async getOrderDetails(order_id: number): Promise<Order> {
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
    orderId: number,
    cancelOrderDto: CancelOrderDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // ตรวจสอบสถานะ หากคำสั่งซื้อชำระเงินแล้ว
    if (order.status === 'paid' || order.status === 'processing') {
      order.status = 'canceled';
      order.customer_name = cancelOrderDto.customer_name;
      order.customer_contact = cancelOrderDto.contact;
    } else {
      throw new Error('Cannot cancel an unpaid order');
    }

    await this.orderRepository.save(order);

    // ดึงข้อมูลคำสั่งซื้อที่อัปเดตพร้อมทุกฟิลด์
    return this.orderRepository.findOne({
      where: { order_id: orderId },
    });
  }

  async updateIngredientStock(
    menuId: number,
    sizeId: number,
    orderQuantity: number,
    orderDate: any,
  ) {
    // 1. Find all ingredients for the menu and size combination
    const menuIngredients = await this.menuIngredientRepository.find({
      where: {
        menu: Equal(menuId),
        size: Equal(sizeId),
      },
      relations: {
        ingredient: true,
        menu: true,
        size: true,
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

  // EDIT ENTITY
  async createOrder(
    createOrderDto: CreateOrderDto,
    items: OrderItemDto[],
  ): Promise<any> {
    const newOrder = this.orderRepository.create({
      ...createOrderDto,
      is_paid: false,
    });

    const savedOrder = await this.orderRepository.save(newOrder);

    // const allAddOns = await this.addOnRepository.findBy({
    //   add_on_id: In(items.flatMap((item) => item.add_on_id || [])),
    // });

    const orderItems = await Promise.all(
      items.map(async (item) => {
        const menu = await this.menuRepository.findOneBy({
          menu_id: item.menu_id,
        });
        const sweetness = await this.sweetnessRepository.findOneBy({
          sweetness_id: item.sweetness_id,
        });
        const size = await this.sizeRepository.findOneBy({
          size_id: item.size_id,
        });
        const menuType = await this.menuTypeRepository.findOneBy({
          menu_type_id: item.menu_type_id,
        });

        if (!menu || !sweetness || !size || !menuType) {
          console.warn(
            `⚠️ Skipping invalid OrderItem: ${JSON.stringify(item)}`,
          );
          return null;
        }

        try {
          // Update ingredient stock levels
          await this.updateIngredientStock(
            item.menu_id,
            item.size_id,
            item.quantity,
            savedOrder.order_date,
          );
        } catch (error) {
          console.error(`Failed to update ingredient stock: ${error.message}`);
          // You might want to handle this error differently
        }

        // const relatedAddOns = allAddOns.filter((addon) =>
        //   item.add_on_id.includes(addon.add_on_id),
        // );

        // edit entity
        // return this.orderItemRepository.create({
        //   quantity: item.quantity,
        //   price: item.price,
        //   menu,
        //   sweetness,
        //   size,
        //   menu_type: menuType,
        //   addOns: relatedAddOns,
        //   order: savedOrder,
        // });
      }),
    );

    // Filter out null items and save valid order items
    const validOrderItems = orderItems.filter((item) => item !== null);
    await this.orderItemRepository.save(validOrderItems);

    return savedOrder;
  }
  // EDIT ENTITY
  async findAllOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: [
        'order_item',
        'order_item.menu',
        'order_item.sweetness',
        'order_item.size',
        'order_item.addOns',
        'order_item.menu_type',
      ],
      select: {
        order_id: true,
        order_date: true,
        // total_price: true,
        queue_number: true,
        status: true,
        customer_name: true,
        customer_contact: true,
        cancel_status: true,
        // edit entity
        // order_item: {
        //   order_item_id: true,
        //   quantity: true,
        //   price: true,
        //   menu: {
        //     menu_id: true,
        //     menu_name: true, // ✅ เอาเฉพาะ `menu_id` และ `menu_name`
        //   },
        // sweetness: {
        //   sweetness_id: true,
        //   level_name: true,
        // },
        // size: {
        //   size_id: true,
        //   size_name: true,
        // },
        // edit entity
        // addOns: {
        //   add_on_id: true,
        //   add_on_name: true,
        // },
        // menuType: {
        //   menu_type_id: true,
        //   type_name: true,
        // },
        // },
      },
    });
  }

  async findOrderById(order_id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id },
      relations: [
        'order_item',
        'order_item.menu',
        'order_item.sweetness',
        'order_item.size',
        'order_item.addOns',
        'order_item.menu_type',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    return order;
  }

  //--------- change status to complete order --------//
  async completeOrder(
    order_id: number,
    completeOrderDto: CompleteOrderDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id: order_id },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    if (order.status === 'paid' || order.status === 'processing') {
      order.status = 'success';
    } else {
      throw new Error('Cannot make order successful');
    }

    await this.orderRepository.save(order);

    return this.orderRepository.findOne({ where: { order_id: order_id } });
  }

  //--------- pay with cash --------//
  async payWithCash(
    order_id: number,
    payWithCashDto: PayWithCashDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id: order_id },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    let payment = await this.paymentRepository.findOne({
      where: { order: { order_id: order_id } },
    });

    if (!payment) {
      // If no payment exists, create a new one
      payment = this.paymentRepository.create({
        order,
        cash_given: payWithCashDto.cash_given,
        change: payWithCashDto.change,
        payment_method: 'cash',
        status: 'cash',
        payment_date: new Date(),
        amount: payWithCashDto.amount,
        total_amount: payWithCashDto.total_amount,
      });
      await this.paymentRepository.save(payment);
    } else {
      // Update the existing payment
      payment.cash_given = payWithCashDto.cash_given;
      payment.change = payWithCashDto.change;
      payment.payment_method = 'cash';
      payment.status = 'cash';
      payment.payment_date = new Date();
      payment.amount = payWithCashDto.amount;
      payment.total_amount = payWithCashDto.total_amount;

      await this.paymentRepository.save(payment);
    }

    return this.orderRepository.findOne({ where: { order_id: order_id } });
  }
}
