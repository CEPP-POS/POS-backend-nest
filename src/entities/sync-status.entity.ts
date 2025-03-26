import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { LocalData } from './local-data.entity';
import { Owner } from './owner.entity';
import { v4 as uuidv4 } from 'uuid';

export enum syncStatus {
  'online',
  'offline',
}

@Entity('sync_status')
export class SyncStatus {
  @PrimaryColumn({ type: 'uuid', default: () => `'${uuidv4()}'` })
  sync_status_id: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Owner, (owner) => owner.syncStatus)
  owner: Owner;

  @ManyToOne(() => Branch, (branch) => branch.syncStatus)
  branch: Branch;
}
