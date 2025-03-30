import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderTopic {
  @IsString()
  order_id: string;

  @IsDate()
  order_date: Date;

  @IsNumber()
  quantity: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  total_amount: number;

  @IsString()
  payment_method: string;

  @IsString()
  cancel_status: string;

  @IsString()
  image_url: string;
}

export class OrderTopicDto {
  @IsNumber()
  total_orders: number;

  @IsNumber()
  canceled_orders: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderTopic)
  order_topic: OrderTopic[];
}
