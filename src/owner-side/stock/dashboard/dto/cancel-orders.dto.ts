export class CancelOrderDto {
    order_id: number;
    order_date: string; // You can parse this into a Date object if necessary
    quantity: number;
    total_amount: number;
    payment_method: string;
    cancel_status: string;
  }


export class CancelOrderTopicDto {
    cancel_order_topic: CancelOrderDto[];
  }