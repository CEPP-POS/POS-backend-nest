import { IsString } from 'class-validator';

export class UpdateCancelStatusDto {
  @IsString()
  cancel_status: string;
}
