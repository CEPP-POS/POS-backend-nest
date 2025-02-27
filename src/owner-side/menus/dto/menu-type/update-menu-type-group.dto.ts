import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class MenuTypeOptionDto {
  @IsOptional()
  @IsString()
  menu_type_id?: string;

  @IsString()
  type_id: string;

  @IsNotEmpty()
  type_name: string;

  @IsNumber()
  price_difference: number;
}

export class UpdateMenuTypeGroupDto {
  @IsString()
  old_menu_type_group_name: string;

  @IsString()
  new_menu_type_group_name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuTypeOptionDto)
  options: MenuTypeOptionDto[];

  @IsArray()
  @IsNumber({}, { each: true })
  menu_id: number[];
}
