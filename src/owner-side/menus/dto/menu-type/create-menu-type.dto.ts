import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMenuTypeDto {
  @IsOptional()
  @IsString()
  menu_type_id?: string;

  @IsNotEmpty()
  @IsString()
  type_name: string;

  @IsOptional()
  @IsNumber()
  price_difference?: number;

  @IsOptional()
  @IsBoolean()
  is_delete?: boolean;

  @IsNotEmpty()
  @IsString()
  owner_id: string;

  @IsNotEmpty()
  @IsString()
  branch_id: string;
}
