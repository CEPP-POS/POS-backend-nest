import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsString,
  IsOptional,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { AddOn } from 'src/entities/add-on.entity';
class AddonOption {
  @IsOptional()
  ingredient_id?: string;

  @IsOptional()
  add_on_id?: string;

  @IsString()
  add_on_name: string;

  @IsString()
  price: string;

  @IsString()
  unit: string;

  @IsOptional()
  quantity?: number;
}
export class CreateAddOnDto {
  @IsArray()
  menu_id: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AddOn)
  options: AddonOption[];

  @IsBoolean()
  is_required: boolean;

  @IsBoolean()
  is_multipled: boolean;
}
