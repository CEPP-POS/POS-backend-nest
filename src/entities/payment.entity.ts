import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Order } from './order.entity';
import { OcrStatus } from './ocr-status.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @OneToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn()
  payment_date: Date;

  @Column({ type: 'varchar', length: 255 })
  payment_method: string;

  @Column()
  amount: number;

  @Column()
  total_amount: number;

  @Column({ type: 'varchar', length: 255 })
  status: string;

  @Column({ type: 'varchar', length: 255 })
  path_img: string;

  @Column({ nullable: false })
  cash_given: number;

  @Column({ nullable: false })
  change: number;

  // for success connect one to many in ocr status
  @ManyToOne(() => OcrStatus, (ocr_status) => ocr_status.ocr_status_id, { nullable: true })
  @JoinColumn({ name: 'ocr_status_id' })
  ocr_status_id: OcrStatus;
}
