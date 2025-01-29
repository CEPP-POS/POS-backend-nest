export class CheckOrderInputDTO {
    orderId: number;
  }
  
  export class CheckOrderOutputDTO {
    order_id: number;
    payment_method: string;
    status: boolean;
    order_summary: Array<{
      menu_id: number;
      menu_type_id: number;
      size_id: number;
      sweetness_id: number;
      add_on_id: number;
      quantity: number;
      price: number;
    }>;
  }
  