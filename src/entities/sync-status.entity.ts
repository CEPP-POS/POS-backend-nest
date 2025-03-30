import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { Owner } from './owner.entity';

export enum syncStatus {
  'online',
  'offline',
}

@Entity('sync_status')
export class SyncStatus {
  @PrimaryGeneratedColumn('uuid')
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

  @Column({ nullable: true })
  owner_id: string;

  @Column({ nullable: true })
  branch_id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Owner, (owner) => owner.syncStatus)
  owner: Owner;

  @ManyToOne(() => Branch, (branch) => branch.syncStatus)
  branch: Branch;
}
