import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateMenuTypeGroupDto {
  @IsOptional()
  @IsString()
  menu_type_group_name?: string;

  @IsOptional()
  @IsArray()
  options: { [key: string]: string }[];

  @IsOptional()
  @IsArray()
  menu_id: number[];
}
