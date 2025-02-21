import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { SyncStatus } from './sync-status.entity';
import { Order } from './order.entity';
import { Owner } from './owner.entity'; 
import { Branch } from './branch.entity';

export enum OperationType {
  INSERT = 'Insert',
  UPDATE = 'Update',
  DELETE = 'Delete',
}

export enum Status {
  'pending',
  'synced',
}

@Entity()
export class LocalData {
  @PrimaryGeneratedColumn()
  local_data_id: number;

  @Column()
  table_name: string;

  @OneToOne(() => Order, (order) => order.local_data, { nullable: false })
  @JoinColumn({ name: 'order_id' }) // Foreign key is `order_id`
  order: Order;

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.INSERT,
    nullable: false,
  })
  operation_type: OperationType;

  @Column({
    type: 'json',
    nullable: true,
  })
  data: any;

  @ManyToOne(() => SyncStatus, { nullable: false })
  @JoinColumn({ name: 'sync_status_id' })
  sync_status: SyncStatus;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.pending,
    nullable: true,
  })
  status: Status;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
