import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Branch } from './branch.entity';
import { LocalData } from './local-data.entity';

export enum syncStatus {
  'online',
  'offline',
}

@Entity()
export class SyncStatus {
  @PrimaryGeneratedColumn()
  sync_status_id: number;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @CreateDateColumn()
  last_sync: Date;

  @Column({
    type: 'enum',
    enum: syncStatus,
    default: syncStatus.online,
    nullable: true,
  })
  status: syncStatus;

  @OneToMany(() => LocalData, (localData) => localData.sync_status, {
    cascade: true,
  })
  localData: LocalData[];
}
