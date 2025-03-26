import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity('sync_status')
export class SyncStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string;

  @Column()
  method: string;

  @Column({ type: 'int' })
  statusCode: number;

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
