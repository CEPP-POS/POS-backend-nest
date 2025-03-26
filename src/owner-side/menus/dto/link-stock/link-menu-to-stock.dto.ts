import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class IngredientListForStockDto {
  @IsOptional()
  @IsString()
  menu_ingredient_id?: string;

  @IsString()
  size_id: string;

  @IsString()
  menu_type_id: string;

  @IsInt()
  quantity_used: number;
}

export class LinkMenuToStockDto {
  @IsString()
  @IsOptional()
  ingredient_id?: string;

  @IsString()
  owner_id: string;

  @IsString()
  branch_id: string;

  @IsString()
  ingredient_name: string;

  @IsString()
  unit: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientListForStockDto)
  ingredientListForStock: IngredientListForStockDto[];
}
