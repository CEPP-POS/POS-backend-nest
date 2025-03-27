import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

interface SweetnessOption {
  sweetness_id: string | null;
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
  menu_id: string[];
}
