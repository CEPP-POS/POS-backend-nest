export class CancelOrderDto {
  order_id: number;
  order_date: Date;
  quantity: number;
  amount: number;
  total_amount: number;
  payment_method: string;
  cancel_status: string; // Ensure this matches the type of `cancel_status`
}

export type CancelOrderTopicDto = CancelOrderDto[]; // Define this as an array of `CancelOrderDto`
