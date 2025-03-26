import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  category_id?: string;

  @IsString()
  category_name: string;

  @IsArray()
  @IsOptional()
  @ArrayNotEmpty()
  // @IsInt({ each: true })
  menu_id: string[];

  @IsString()
  owner_id: string;

  @IsString()
  branch_id: string;
}
