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
