import { IsNotEmpty, IsInt, Min, IsArray } from 'class-validator';

export class OrderItemDto {
  @IsNotEmpty()
  order_item_id: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @Min(0)
  price: number;

  menu_id: number;

  sweetness_id: number;

  size_id: number;

  @IsNotEmpty()
  order_id: number;

  @IsArray()
  @IsInt({ each: true })
  add_on_id: number[];

  menu_type_id: number;
}
