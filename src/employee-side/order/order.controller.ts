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
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order/create-order.dto';
import { UpdateOrderDto } from './dto/update-order/update-order.dto';
import { CancelOrderDto } from './dto/cancel-order/Cancel-order.dto';
import { OrderItemDto } from './dto/order-item/order-item.dto';
import { PayWithCashDto } from './dto/pay-with-cash/pay-with-cash.dto';
// import { CompleteOrderDto } from './dto/complete-order/complete-order.dto';

@Controller('employee/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  async createOrder(
    @Headers('owner-id') owner_id: string,
    @Headers('branch-id') branch_id: string,
    @Body()
    {
      createOrderDto,
      items,
    }: {
      createOrderDto: CreateOrderDto;
      items: OrderItemDto[];
    },
  ) {
    return this.orderService.createOrder(
      createOrderDto,
      items,
      owner_id,
      branch_id,
    );
  }

  @Get()
  async findAllOrders(
    @Headers('owner-id') owner_id: string,
    @Headers('branch-id') branch_id: string,
  ) {
    return this.orderService.findAllOrders(owner_id, branch_id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const order = await this.orderService.findOne(id);
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
    const order = await this.orderService.update(id, updateOrderDto);
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
    const order = await this.orderService.findOne(id);
    if (!order) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'Order not found' });
    }
    await this.orderService.remove(id);
    return res.status(HttpStatus.NO_CONTENT).send();
  }
  //
  @Patch(':order_id/cancel')
  async cancelOrder(
    @Headers('owner-id') owner_id: string,
    @Headers('branch-id') branch_id: string,
    @Param('order_id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(
      id,
      cancelOrderDto,
      owner_id,
      branch_id,
    );
  }

  @Patch(':order_id/complete')
  async completeOrder(
    @Param('order_id') id: string,
    @Headers('owner-id') owner_id: string,
    @Headers('branch-id') branch_id: string,
  ) {
    return this.orderService.completeOrder(id, owner_id, branch_id);
  }

  @Post(':id/cash')
  async payWithCash(
    @Param('id') id: string,
    @Body() payWithCashDto: PayWithCashDto,
  ) {
    return this.orderService.payWithCash(id, payWithCashDto);
  }

  @Get('latest')
  async getLatestOrder(@Headers() headers: Record<string, string>) {
    const ownerId = headers['owner-id'];
    const branchId = headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    return this.orderService.getLatestOrder(ownerId, branchId);
  }
}
