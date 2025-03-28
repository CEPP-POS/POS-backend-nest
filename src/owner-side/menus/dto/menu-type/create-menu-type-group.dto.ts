import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

class OptionDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsUUID()
  menu_type_id?: string;

  @IsOptional()
  @IsNumber()
  menu_type_order?: number;
}

export class CreateMenuTypeGroupDto {
  @IsOptional()
  @IsString()
  menu_type_id?: string;

  @IsOptional()
  @IsNumber()
  menu_type_order?: number;

  @IsOptional()
  @IsUUID()
  menu_type_group_id?: string;

  @IsNotEmpty()
  @IsString()
  menu_type_group_name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options: OptionDto[];

  @IsArray()
  @IsString({ each: true })
  menu_id: string[];
}
