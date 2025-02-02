import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Owner } from 'src/entities/owner.entity';
import { Branch } from 'src/entities/branch.entity';

@Entity()
export class SalesSummary {
  @PrimaryGeneratedColumn()
  sales_summary_id: number;

  @Column()
  total_revenue: number;

  @Column()
  total_orders: number;

  @Column()
  canceled_orders: number;

  @Column({ type: 'timestamp' })
  date: Date;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
