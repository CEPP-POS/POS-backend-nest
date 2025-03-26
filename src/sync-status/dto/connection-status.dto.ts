import { IsBoolean } from 'class-validator';

export class ConnectionStatusDto {
  @IsBoolean()
  isOnline: boolean;
} 