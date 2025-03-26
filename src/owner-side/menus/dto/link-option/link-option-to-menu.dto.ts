import { IsString } from 'class-validator';

export class LinkOptionToMenuDto {
  @IsString()
  menu_id: string;

  @IsString()
  option_id: string;
}
