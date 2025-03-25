import { IsString, IsNumber, IsObject } from 'class-validator';

export class TestSyncDto {
  @IsString()
  path: string;

  @IsNumber()
  statusCode: number;

  @IsObject()
  data: any;
} 