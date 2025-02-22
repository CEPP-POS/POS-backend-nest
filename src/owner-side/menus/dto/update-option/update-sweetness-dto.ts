import {
    ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsString,
} from 'class-validator';

export class UpdateSweetnessDto {
  @IsString()
  old_sweetness_group_name: string;

  @IsString()
  new_sweetness_group_name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options: string[];

  @IsArray()
  menu_id: number[];

}
