import { IsArray, IsNumber } from 'class-validator';

export class Linegraph {
  @IsNumber()
  total_revenue: number;

  @IsNumber()
  total_orders: number;

  @IsNumber()
  canceled_orders: number;

  @IsArray()
  daily_stats: DailyStat[];
}

export interface DailyStat {
  date: string;
  totalRevenue: number;
}
