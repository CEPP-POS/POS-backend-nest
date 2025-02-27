import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNumber()
  manager_id: number;

  @IsNotEmpty()
  @IsNumber()
  owner_id: number;

  @IsNotEmpty()
  @IsNumber()
  branch_id: number;
}
