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

  @Column({ type: 'jsonb', nullable: true })
  payload: any;

  @Column({ default: false })
  synced: boolean;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Owner, (owner) => owner.syncStatus)
  owner: Owner;

  @ManyToOne(() => Branch, (branch) => branch.syncStatus)
  branch: Branch;
}
