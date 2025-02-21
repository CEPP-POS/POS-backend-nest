import { IsString, IsArray, ArrayNotEmpty, IsInt, IsBoolean } from 'class-validator';

export class CreateSweetnessDto {
  @IsString()
  sweetness_group_name: string

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  menu_id: number[];
}
