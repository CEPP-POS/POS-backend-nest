import { ArrayNotEmpty, IsArray, IsBoolean, IsString } from 'class-validator';

export class DeleteSweetnessDto {
  @IsString()
  sweetness_group_name: string;
}
