export class OrderTableDto {
    menu_name: string;
    quantity: number;
    amount: number;
    category_name: string;
  }
  
  export class OrderDto {
    order_id: number;
    order_table: OrderTableDto[]; // Array of menu items
    total_amount: number;
    payment_method: string;
    cancel_status: string;
    customer_name: string;
    customer_contact: string;
  }