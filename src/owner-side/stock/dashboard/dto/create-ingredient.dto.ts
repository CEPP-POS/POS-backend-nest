import {
  IsInt,
  IsString,
  IsDateString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateIngredientDto {
  @IsOptional()
  @IsString()
  ingredient_id?: string;

  @IsOptional()
  @IsString()
  ingredient_category_id?: string;

  @IsString()
  image_url: string;

  @IsString()
  owner_id: string;

  @IsString()
  ingredient_name: string;

  @IsNumber()
  net_volume: number;

  @IsString()
  unit: string;

  @IsInt()
  quantity_in_stock: number;

  @IsNumber()
  @IsNotEmpty()
  total_volume: number;

  @IsString()
  category_name: string;

  @IsDateString()
  expiration_date: string;
}
