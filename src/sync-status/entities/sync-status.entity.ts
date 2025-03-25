import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class SyncStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string;

  @Column()
  statusCode: number;

  @Column()
  queue: number;

  @Column('json')
  data: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 