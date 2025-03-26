import { IsString, IsOptional, IsDecimal, IsUrl } from 'class-validator';

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  category_id?: string;

  @IsString()
  @IsOptional()
  menu_name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDecimal()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  owner_id?: string;

  @IsString()
  @IsOptional()
  branch_id?: string;

  @IsUrl()
  @IsOptional()
  image_url?: string;
}
