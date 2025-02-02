import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order/create-order.dto';
import { UpdateOrderDto } from './dto/update-order/update-order.dto';
import { CancelOrderDto } from './dto/cancel-order/Cancel-order.dto';
import { OrderItemDto } from './dto/order-item/order-item.dto';
import { CompleteOrderDto } from './dto/complete-order/complete-order.dto';
import { PayWithCashDto } from './dto/pay-with-cash/pay-with-cash.dto';

@Controller('employee/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // async create(@Body() createOrderDto: CreateOrderDto) {
  //   return this.orderService.create(createOrderDto);
  // }
  // @Get()
  // @HttpCode(HttpStatus.OK)
  // async findAll() {
  //   return this.orderService.findAll();
  // }

  @Post()
  async createOrder(
    @Body()
    {
      createOrderDto,
      items,
    }: {
      createOrderDto: CreateOrderDto;
      items: OrderItemDto[];
    },
  ) {
    return this.orderService.createOrder(createOrderDto, items);
  }

  @Get()
  async findAllOrders() {
    return this.orderService.findAllOrders();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const order = await this.orderService.findOne(+id);
    if (!order) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Order not found' });
    }
    return res.status(HttpStatus.OK).json(order);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Res() res: Response,
  ) {
    const order = await this.orderService.update(+id, updateOrderDto);
    if (!order) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Order not found' });
    }
    return res.status(HttpStatus.OK).json(order);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Res() res: Response) {
    const order = await this.orderService.findOne(+id);
    if (!order) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Order not found' });
    }
    await this.orderService.remove(+id);
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @Param('id') id: number,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(id, cancelOrderDto);
  }

  @Patch(':id/complete')
  async completeOrder(
    @Param('id') id: number,
    @Body() completeOrderDto: CompleteOrderDto,
  ) {
    return this.orderService.completeOrder(id, completeOrderDto);
  }

  @Post(':id/cash')
  async payWithCash(
    @Param('id') id: number,
    @Body() payWithCashDto: PayWithCashDto,
  ) {
    return this.orderService.payWithCash(id, payWithCashDto);
  }
}
