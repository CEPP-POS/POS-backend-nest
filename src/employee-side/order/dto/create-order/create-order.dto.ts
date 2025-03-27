import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsDate,
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Column } from 'typeorm';

export enum CancelStatus {
  RefundPending = 'ยังไม่คืนเงิน',
  Refunded = 'คืนเงินเสร็จสิ้น',
  CancelByEmployee = 'ยกเลิกโดยพนักงาน',
}
export enum PaymentMethod {
  CASH = 'cash',
  QR_CODE = 'qr-code',
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  payment_id?: string;

  sales_summary_id: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  order_date: Date;

  @IsNotEmpty()
  total_price: number;

  @IsInt()
  queue_number?: number;

  @Column({ default: 'รอทำ' }) // สถานะเริ่มต้น
  status: string;

  @IsOptional()
  @IsEnum(CancelStatus)
  cancel_status?: CancelStatus;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  contact: string;

  @IsString()
  @IsOptional()
  path_img?: string;

  @IsNumber()
  @IsOptional()
  cash_given?: number;

  @IsNumber()
  @IsOptional()
  change?: number;
}
