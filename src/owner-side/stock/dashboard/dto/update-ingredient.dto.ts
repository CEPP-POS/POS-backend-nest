import {
  IsInt,
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class UpdateIngredientDto {
  @IsInt()
  update_id: number;

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

