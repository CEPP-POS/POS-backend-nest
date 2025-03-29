import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Order } from './order.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class Payment {
  @PrimaryColumn({ type: 'uuid' })
  payment_id: string;

  @OneToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn()
  payment_date: Date;

  @Column({ type: 'varchar', length: 255 })
  payment_method: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path_img: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  cash_given: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  change: number;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
