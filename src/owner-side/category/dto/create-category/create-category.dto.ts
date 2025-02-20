import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  category_name: string;

  @IsArray()
  @IsOptional()
  @ArrayNotEmpty()
  // @IsInt({ each: true })
  menu_id: number[];

  @IsInt()
  owner_id: number;

  @IsInt()
  branch_id: number;
}
