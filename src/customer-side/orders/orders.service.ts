import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CheckOrderInputDTO } from './dto/check-order.dto'; 
import { CheckOrderOutputDTO } from './dto/check-order.dto';


@Injectable()
export class OrdersService {

    private mockOrders = [
        {
          order_id: 110234,
          payment_method: 'QR-CODE',
          status: false,
          order_summary: [
            {
              menu_id: 1,
              menu_type_id: 1,
              size_id: 2,
              sweetness_id: 2,
              add_on_id: 3,
              quantity: 1,
              price: 69,
            },
            {
              menu_id: 2,
              menu_type_id: 2,
              size_id: 3,
              sweetness_id: 3,
              add_on_id: 4,
              quantity: 2,
              price: 100,
            },
          ],
        },
        {
          order_id: 110235,
          payment_method: 'Cash',
          status: true,
          order_summary: [
            {
              menu_id: 3,
              menu_type_id: 1,
              size_id: 1,
              sweetness_id: 1,
              add_on_id: 2,
              quantity: 2,
              price: 150,
            },
          ],
        },
      ];
    //   async checkOrder(orderDto: CheckOrderInputDTO): Promise<CheckOrderOutputDTO> {
    //     const { orderId } = orderDto;
    
    //     // Find the order in the mock data
    //     const orderDetails = this.mockOrders.find(order => order.order_id === orderId);
    
    //     // If order not found, throw an error
    //     if (!orderDetails) {
    //       throw new NotFoundException('Order not found');
    //     }
    
    //     // Return the found order details
    //     return orderDetails;
    //   }

    async checkOrder(orderDto: CheckOrderInputDTO): Promise<CheckOrderOutputDTO> {
        const { orderId } = orderDto;
        console.log('Received orderId:', orderId);  // Log received orderId
    
        const orderDetails: CheckOrderOutputDTO = {
          order_id: orderId,
          payment_method: 'QR-CODE',
          status: false,
          order_summary: [
            { menu_id: 1, menu_type_id: 1, size_id: 2, sweetness_id: 2, add_on_id: 3, quantity: 1, price: 69 },
            { menu_id: 2, menu_type_id: 2, size_id: 3, sweetness_id: 3, add_on_id: 4, quantity: 2, price: 100 },
          ],
        };
    
        if (orderId === 110234) {
          return orderDetails;  // Return mock data for orderId 110234
        } else {
          console.log('Order not found for orderId:', orderId);  // Log if orderId doesn't match
          throw new NotFoundException('Order not found');
        }
      }
    }

