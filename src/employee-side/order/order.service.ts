import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../../entities/order.entity';
import { CreateOrderDto } from './dto/create-order/create-order.dto';
import { UpdateOrderDto } from './dto/update-order/update-order.dto';
import { CancelOrderDto } from './dto/cancel-order/Cancel-order.dto';
import { SalesSummary } from 'src/entities/sales-summary';
import { OrderItem } from '../../entities/order-item.entity';
import { Branch } from 'src/entities/branch.entity';
import { Owner } from 'src/entities/owner.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(SalesSummary)
    private salesSummaryRepository: Repository<SalesSummary>,

    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,

    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,

    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {

    const owner = await this.ownerRepository.findOne({ where: { owner_id: 1 } });
    const branch = await this.branchRepository.findOne({ where: { branch_id: 1 } });

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

  //--------- each order item in order --------//
  async findAllOrderItems(): Promise<any[]> {
    const orderItems = await this.orderItemRepository.find({
      order: {
        order_item_id: 'ASC',
      },
      relations: [
        'menu_id',
        'sweetness_id',
        'menu_type_id',
        'add_on_id',
        'size_id',
      ],
    });

    return orderItems.map((orderItem) => ({
      order_item_id: orderItem.order_item_id,
      quantity: orderItem.quantity,
      price: orderItem.price,
      menu_name: orderItem.menu_id.menu_name,
      menu_price: orderItem.menu_id.price,
      image_url: orderItem.menu_id.image_url,
      level_name: orderItem.sweetness_id.level_name,
      type_name: orderItem.menu_type_id.type_name,
      add_on_name: orderItem.add_on_id[0]?.add_on_name,
      size_name: orderItem.size_id.size_name,
    }));
  }
}
