import { IsEnum, IsInt, IsNotEmpty, IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Column } from 'typeorm';

export enum CancelStatus {
  RefundComplete = 'คืนเงินเสร็จสิ้น',
  RefundPending = 'ยังไม่คืนเงิน',
}
export enum PaymentMethod {
  CASH = 'cash',
  QR_CODE = 'qr-code',
}

export class CreateOrderDto {
  @IsDate()
  @Type(() => Date)
  order_date: Date;

  @IsNumber()
  @IsNotEmpty()
  total_price: number;

  @IsInt()
  @IsNotEmpty()
  queue_number: number;

  @Column({ default: 'รอทำ' }) // สถานะเริ่มต้น
  status: string;

  @IsEnum(CancelStatus)
  @IsNotEmpty()
  cancel_status: CancelStatus;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @Column({ nullable: true })
  path_img?: string;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  contact: string;
}
