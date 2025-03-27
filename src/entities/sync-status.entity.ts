import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { Owner } from './owner.entity';

export enum syncStatus {
  'online',
  'offline',
}

@Entity('sync_status')
export class SyncStatus {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column()
  path: string;

  @Column()
  method: string;

  @Column('jsonb')
  payload: any;

  @Column({ default: false })
  synced: boolean;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  errorMessage: string;

  @Column('jsonb', { nullable: true })
  headers: any;

  @Column({ nullable: true })
  statusCode: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Owner, (owner) => owner.syncStatus)
  owner: Owner;

  @ManyToOne(() => Branch, (branch) => branch.syncStatus)
  branch: Branch;
}
