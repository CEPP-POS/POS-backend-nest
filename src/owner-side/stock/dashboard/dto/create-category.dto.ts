import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsOptional()
  @IsString()
  ingredient_category_id?: string;

  @IsString()
  category_name: string;
}
