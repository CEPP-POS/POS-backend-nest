import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

import { Owner } from 'src/entities/owner.entity';
import { Branch } from 'src/entities/branch.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class SalesSummary {
  @PrimaryColumn({ type: 'uuid', default: () => `'${uuidv4()}'` })
  sales_summary_id: string;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column()
  total_revenue: number;

  @Column()
  total_orders: number;

  @Column()
  canceled_orders: number;

  @Column({ type: 'timestamp' })
  date: Date;
}
