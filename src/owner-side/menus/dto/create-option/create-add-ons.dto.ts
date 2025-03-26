import { IsArray, IsBoolean, IsString } from 'class-validator';

export class CreateAddOnDto {
  @IsArray()
  options: Array<
    Record<
      string,
      {
        menu_ingredient_id?: string;
        ingredient_id?: string;
        add_on_id?: string;
        price: string;
        unit: string;
        quantity: string;
      }
    >
  >;

  @IsString()
  menu_id: string[];

  @IsBoolean()
  is_required: boolean;

  @IsBoolean()
  is_multipled: boolean;
}
