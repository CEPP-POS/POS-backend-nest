import {
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';

export class OrderItemDto {
  @IsOptional()
  @IsString()
  order_item_id?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @Min(0)
  price: number;

  menu_id: string;

  sweetness_id: string;

  size_id: string;

  @IsNotEmpty()
  order_id: string;

  @IsArray()
  @IsInt({ each: true })
  add_on_id: string[];

  menu_type_id: string;
}
