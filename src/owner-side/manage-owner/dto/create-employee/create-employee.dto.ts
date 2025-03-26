import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  manager_id: string;

  @IsNotEmpty()
  @IsString()
  owner_id: string;

  @IsNotEmpty()
  @IsString()
  branch_id: string;
}
