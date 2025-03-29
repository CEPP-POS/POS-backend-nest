import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

import { Owner } from 'src/entities/owner.entity';
import { Branch } from 'src/entities/branch.entity';

@Entity()
export class SalesSummary {
  @PrimaryColumn({ type: 'uuid' })
  sales_summary_id: string;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_revenue: number;

  @Column()
  total_orders: number;

  @Column()
  canceled_orders: number;

  @Column({ type: 'timestamp' })
  date: Date;
}
