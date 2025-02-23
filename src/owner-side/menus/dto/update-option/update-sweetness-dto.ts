import { ArrayNotEmpty, IsArray, IsBoolean, IsString } from 'class-validator';

interface SweetnessOption {
  sweetness_id: number | null;
  level_name: string;
}

export class UpdateSweetnessDto {
  @IsString()
  old_sweetness_group_name: string;

  @IsString()
  new_sweetness_group_name: string;

  @IsArray()
  @ArrayNotEmpty()
  options: SweetnessOption[];

  @IsArray()
  menu_id: number[];
}
