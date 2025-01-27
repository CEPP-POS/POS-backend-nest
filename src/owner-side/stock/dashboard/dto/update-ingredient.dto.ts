import { IsInt, IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class UpdateIngredientDto {
  @IsOptional()
  @IsInt()
  ingredient_id?: number;

  @IsOptional()
  @IsString()
  ingredient_name?: string;

  @IsOptional()
  @IsNumber()
  net_volume?: number;

  @IsOptional()
  @IsInt()
  quantity_in_stock?: number;

  @IsOptional()
  @IsNumber()
  total_volume?: number;

  @IsOptional()
  @IsString()
  category_name?: string;

  @IsOptional()
  @IsDateString()
  expiration_date?: string;  // This should be an ISO string
}
