import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty()
  @IsString()
  branch_id: string;

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
  @IsString()
  owner_id: string;
}
