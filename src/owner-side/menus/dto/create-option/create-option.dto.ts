import {
  IsString,
  IsDecimal,
  IsOptional,
  IsInt,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateOptionDto {
  @IsArray()
  @ArrayNotEmpty()
  options: Record<string, string>[];

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

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  menu_id: number[];
}
