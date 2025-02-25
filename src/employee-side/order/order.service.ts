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
import { Owner } from 'src/entities/owner.entity';
import { PayWithCashDto } from './dto/pay-with-cash/pay-with-cash.dto';
import { Payment } from 'src/entities/payment.entity';
import { SalesSummary } from 'src/entities/sales-summary.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';
import { IngredientUpdate } from 'src/entities/ingredient-update.entity';
import { OrderItemAddOn } from 'src/entities/order-item-add-on.entity';
import { PaymentMethod } from './dto/create-order/create-order.dto';

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
    // console.log(newOrder.order_date);
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
    addOnIds: number[] = [],
  ) {
    // 1. Find all ingredients for the menu and size combination
    const menuIngredients = await this.menuIngredientRepository.find({
      where: [
        {
          menu: Equal(menuId),
          size: Equal(sizeId),
          is_addon: false,
        },
        {
          ingredient: In(addOnIds),
          is_addon: true,
        },
      ],
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

  async createOrder(
    createOrderDto: CreateOrderDto,
    items: OrderItemDto[],
    owner_id: number,
    branch_id: number,
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

    const newOrder = this.orderRepository.create({
      ...createOrderDto,
      is_paid: false,
      owner,
      branch,
    });

    const savedOrder = await this.orderRepository.save(newOrder);

    // คำนวณ total_amount รวม VAT 7%
    const totalAmount = createOrderDto.total_price * 1.07;

    // สร้าง payment record ตามวิธีการชำระเงิน
    const payment = this.paymentRepository.create({
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
      // เพิ่มข้อมูลการชำระเงินสดถ้าเป็นการชำระด้วยเงินสด
      ...(createOrderDto.payment_method === PaymentMethod.CASH && {
        cash_given: createOrderDto.cash_given,
        change: createOrderDto.change,
      }),
    });

    await this.paymentRepository.save(payment);

    // ถ้าเป็นการชำระเงินสด ให้อัพเดทสถานะ order เป็น paid ทันที
    if (createOrderDto.payment_method === PaymentMethod.CASH) {
      savedOrder.status = 'paid';
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
          );
        } catch (error) {
          console.error(`Failed to update ingredient stock: ${error.message}`);
          throw error;
        }

        // Create order item first
        const orderItem = this.orderItemRepository.create({
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
            const addon = this.orderItemAddOnRepository.create({
              order_item_id: savedOrderItem.order_item_id,
              ingredient_id: addon_id,
              owner,
              branch,
            });
            return await this.orderItemAddOnRepository.save(addon);
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

  async findAllOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: [
        'order_item',
        'order_item.menu',
        'order_item.sweetnessLevel',
        'order_item.size',
        'order_item.orderItem',
        'order_item.menuType',
      ],
      select: {
        order_id: true,
        order_date: true,
        queue_number: true,
        status: true,
        customer_name: true,
        customer_contact: true,
        cancel_status: true,
      },
    });
  }

  async findOrderById(order_id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_id },
      relations: [
        'order_item',
        'order_item.menu',
        'order_item.sweetnessLevel',
        'order_item.size',
        'order_item.orderItem',
        'order_item.menuType',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    return order;
  }

  async completeOrder(order_id: number): Promise<Order> {
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

  async payWithCash(
    order_id: number,
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
    const savedPayment = await this.paymentRepository.save(payment);

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
    order_id: number,
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
}
