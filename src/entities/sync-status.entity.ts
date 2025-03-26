import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Branch } from './branch.entity';
import { LocalData } from './local-data.entity';
import { Owner } from './owner.entity';
import { v4 as uuidv4 } from 'uuid';

export enum syncStatus {
  'online',
  'offline',
}

@Entity()
export class SyncStatus {
  @PrimaryColumn({ type: 'uuid', default: () => `'${uuidv4()}'` })
  sync_status_id: string;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

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
