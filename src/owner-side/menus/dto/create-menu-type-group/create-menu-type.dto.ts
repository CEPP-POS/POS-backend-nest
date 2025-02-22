import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMenuTypeDto {
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
  @IsNumber()
  owner_id: number;

  @IsNotEmpty()
  @IsNumber()
  branch_id: number;
}
