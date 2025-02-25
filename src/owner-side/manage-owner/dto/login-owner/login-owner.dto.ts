import { IsString, IsOptional } from 'class-validator';

export class LoginOwnerDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  branch_id?: number;
}
