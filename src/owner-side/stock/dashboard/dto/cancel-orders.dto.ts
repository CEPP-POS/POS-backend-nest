export class CancelOrderDto {
  order_id: number;
  order_date: Date;
  quantity: number;
  // total_amount: number;
  payment_method: string;
  cancel_order_topic: string; // Ensure this matches the type of `cancel_status`
}

export type CancelOrderTopicDto = CancelOrderDto[]; // Define this as an array of `CancelOrderDto`
