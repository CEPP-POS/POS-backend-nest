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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path_img: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cash_given: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  change: number;
}
