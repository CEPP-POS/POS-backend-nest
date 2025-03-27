import { IsString, IsOptional } from 'class-validator';

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  branch_name?: string;

  @IsString()
  @IsOptional()
  branch_address?: string;

  @IsString()
  @IsOptional()
  branch_phone_number?: string;

  @IsString()
  @IsOptional()
  owner_id?: string;
}
