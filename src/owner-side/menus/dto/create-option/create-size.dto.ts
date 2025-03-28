import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Size } from 'src/entities/size.entity';

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
  @ValidateNested({ each: true })
  @Type(() => Size)
  options: Size[];

  @IsArray()
  @IsString({ each: true })
  menu_id: string[];

  @IsBoolean()
  is_required: boolean;
}
