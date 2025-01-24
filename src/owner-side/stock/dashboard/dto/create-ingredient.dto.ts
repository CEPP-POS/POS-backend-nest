import { IsInt, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateIngredientDto {
  @IsInt()
  ingredient_id: number;

  @IsString()
  ingredient_name: string;

  @IsNumber()
  net_volume: number;

  @IsInt()
  quantity_in_stock: number;

  @IsNumber()
  total_volume: number;

  @IsString()
  category_name: string;

  @IsDateString()
  expiration_date: string;  // Ensure you use a valid ISO date string
}
