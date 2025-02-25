import { IsString, MinLength, IsEmail } from 'class-validator';

export class UpdatePasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ResetPasswordDto {
  @IsString()
  usernameOrEmail: string;

  @IsString()
  newPassword: string;
}
