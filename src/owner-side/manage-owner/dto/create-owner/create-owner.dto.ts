import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOwnerDto {
  @IsOptional()
  @IsString()
  owner_id?: string;

  @IsOptional()
  @IsString()
  branch_id?: string;

  @IsString()
  @IsNotEmpty()
  owner_name: string;

  @IsString()
  @IsNotEmpty()
  contact_info: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  roles?: string[];
}
