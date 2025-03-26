import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateMenuDto {
  @IsNotEmpty()
  @IsString()
  menu_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  paused?: boolean;

  @IsOptional()
  @IsBoolean()
  is_delete?: boolean;

  @IsNotEmpty()
  @IsString()
  menu_type_group_name: string;

  @IsNotEmpty()
  @IsString()
  owner_id: string;

  @IsNotEmpty()
  @IsString()
  branch_id: string;
}
