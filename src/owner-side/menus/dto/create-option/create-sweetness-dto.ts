import {
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateSweetnessDto {
  @IsOptional()
  @IsString()
  sweetness_id?: string;

  @IsOptional()
  @IsString()
  sweetness_group_id?: string;

  @IsString()
  sweetness_group_name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  menu_id: string[];

  @IsBoolean()
  is_required: boolean;
}
