import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SweetnessOption {
  @IsOptional()
  @IsString()
  sweetness_id?: string;

  @IsString()
  level_name: string;
}

export class CreateSweetnessDto {
  @IsOptional()
  @IsString()
  sweetness_id?: string;

  @IsOptional()
  @IsNumber()
  sweetness_order?: number;

  @IsOptional()
  @IsString()
  sweetness_group_id?: string;

  @IsString()
  sweetness_group_name: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SweetnessOption)
  options: SweetnessOption[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  menu_id: string[];

  @IsBoolean()
  is_required: boolean;
}
