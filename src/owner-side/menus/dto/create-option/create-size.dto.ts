import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Size } from 'src/entities/size.entity';
class SizeOption {
  @IsOptional()
  @IsString()
  size_id?: string;

  @IsString()
  level_name: string;

  @IsOptional()
  @IsString()
  size_order?: number;
}

export class CreateSizeDto {
  @IsOptional()
  @IsString()
  size_group_id?: string;

  @IsOptional()
  @IsNumber()
  size_order?: number;

  @IsString()
  size_group_name: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => Size)
  options: SizeOption[];

  @IsArray()
  @IsString({ each: true })
  menu_id: string[];

  @IsBoolean()
  is_required: boolean;
}
