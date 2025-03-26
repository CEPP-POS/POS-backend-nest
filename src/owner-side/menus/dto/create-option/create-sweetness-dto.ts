import { IsString, IsArray, ArrayNotEmpty, IsBoolean } from 'class-validator';

export class CreateSweetnessDto {
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
