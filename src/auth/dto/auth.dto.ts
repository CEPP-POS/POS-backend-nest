import { IsString, IsEmail } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsString()
  usernameOrEmail: string;
}

export class VerifyOtpDto {
  @IsString()
  usernameOrEmail: string;

  @IsString()
  otp: string;
}
