import { IsInt, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  image_url: string;

  @IsInt()
  owner_id: number;

  @IsString()
  ingredient_name: string;

  @IsNumber()
  net_volume: number;

  @IsString()
  unit: string;

  @IsInt()
  quantity_in_stock: number;

  @IsString()
  category_name: string;

  @IsDateString()
  expiration_date: string;
}
