import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty()
  @IsString()
  branch_name: string;

  @IsNotEmpty()
  @IsString()
  branch_address: string; 

  @IsNotEmpty()
  @IsString()
  branch_phone_number: string;

  @IsNotEmpty()
  @IsNumber()
  owner_id: number;
}
