import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OptionDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;
}

export class CreateMenuTypeGroupDto {
  @IsNotEmpty()
  @IsString()
  menu_type_group_name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options: OptionDto[];

  @IsArray()
  @IsNumber({}, { each: true })
  menu_id: number[];
}
