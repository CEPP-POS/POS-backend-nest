import { Type } from 'class-transformer';
import {
  IsString,
  IsDecimal,
  IsOptional,
  IsInt,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';

class OptionDetailDto {
  @IsString()
  price: string;

  @IsNumber()
  unit: number;
}

export class CreateOptionDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Object)
  options: Record<string, OptionDetailDto>[];

  @IsString()
  add_on_name: string;

  @IsDecimal()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  type_name?: string; // For menu-types

  @IsDecimal()
  @IsOptional()
  price_difference?: number; // For menu-types

  @IsInt()
  @IsOptional()
  menu_ingredient_id?: number;

  @IsOptional()
  @IsNumber()
  unit?: number; // ปริมาณที่ใช้

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  menu_id: number[];
}
