import { IsString } from 'class-validator';

export class DeleteSweetnessDto {
  @IsString()
  sweetness_group_name: string;
}
