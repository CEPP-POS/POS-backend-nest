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
import { OrdersService } from './orders.service';
import { CheckOrderInputDTO, CheckOrderOutputDTO } from './dto/check-order.dto';



@Controller('customer/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST method to check the order by orderId
  @Post('item')
  async checkOrder(@Body() orderDto: CheckOrderInputDTO): Promise<CheckOrderOutputDTO | any> {
    try {
      // Call the service method to get order details
      const orderDetails = await this.ordersService.checkOrder(orderDto);
      return orderDetails;
    } catch (error) {
      return { message: 'Order not found or error occurred' };
    }
  }
}



