import { IsString, IsArray, ArrayNotEmpty, IsInt } from 'class-validator';

export class CreateSweetnessDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  options: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  menu_id: number[];
}
