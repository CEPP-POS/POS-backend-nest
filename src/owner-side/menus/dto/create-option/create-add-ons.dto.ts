import { IsArray, IsObject, IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateAddOnDto {
  @IsArray()
  options: Array<Record<string, { price: string, unit: string, quantity: string }>>;

  @IsArray()
  menu_id: number[];

  @IsBoolean()
  is_required: boolean;

  @IsBoolean()
  is_multipled: boolean;
}
