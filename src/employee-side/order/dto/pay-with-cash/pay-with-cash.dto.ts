import { IsNotEmpty, IsInt, IsNumber } from 'class-validator';
import { Column, CreateDateColumn, JoinColumn, OneToOne } from 'typeorm';
import { Order } from 'src/entities/order.entity';

export class PayWithCashDto {
  @OneToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn()
  payment_date: Date;

  @Column({ type: 'varchar', length: 255 })
  payment_method: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  total_amount: number;

  @IsNumber()
  @IsNotEmpty()
  cash_given: number;

  @IsNumber()
  @IsNotEmpty()
  change: number;

  @Column()
  @IsInt()
  status: string;
}
