import { IsString, IsNumber, IsArray } from 'class-validator';

export class MenuCustomerDto {
  @IsString()
  menu_name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsArray()
  category: string[];
}

export class MenuTypeDto {
  menu_type_id: number;
  name: string;
  price_addition: number;
}

export class SweetnessLevelDto {
  sweetness_id: number;
  level_name: string;
}

export class SizeDto {
  size_id: number;
  name: string;
  price_addition: number;
}

export class AddOnDto {
  add_on_id: number;
  name: string;
  price_addition: number;
  is_required: boolean;
  is_multiple: boolean;
}

export class MenuDetailDto {
  menu_id: number;
  menu_name: string;
  price: number;
  description: string;
  image_url: string;
  type_name: MenuTypeDto[];
  level_name: SweetnessLevelDto[];
  size_name: SizeDto[];
  add_on_name: AddOnDto[];
}
