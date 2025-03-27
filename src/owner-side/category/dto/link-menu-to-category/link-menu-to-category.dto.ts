import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class LinkMenuToCategoryDto {
  @IsString()
  category_id: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  menu_ids: string[]; // ลิสต์ของ menu_id ที่ต้องการเพิ่มในหมวดหมู่

  @IsString()
  owner_id?: string; // Ensure these exist in DTO

  @IsString()
  branch_id?: string;
}
