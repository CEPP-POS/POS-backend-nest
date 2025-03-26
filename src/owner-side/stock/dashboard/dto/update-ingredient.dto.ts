import {
  IsInt,
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UpdateIngredientDto {
  @IsString()
  update_id: string;

  @IsOptional()
  @IsInt()
  quantity_in_stock?: number;

  @IsOptional()
  @IsNumber()
  total_volume?: number;

  @IsOptional()
  @IsDateString()
  expiration_date?: Date;

  @IsOptional()
  @IsNumber()
  net_volume?: number;
}
