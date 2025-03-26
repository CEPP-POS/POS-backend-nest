import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sync_queue')
export class SyncQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  owner_id: number;

  @Column()
  branch_id: number;

  @Column()
  table_name: string; // ชื่อตารางที่ต้องการซิงค์ เช่น 'orders', 'products'

  @Column('jsonb')
  data: any; // ข้อมูลที่ต้องการซิงค์

  @Column()
  operation: string; // 'INSERT', 'UPDATE', 'DELETE'

  @Column({ default: 0 })
  retry_count: number; // จำนวนครั้งที่พยายามส่งข้อมูล

  @Column({ default: 'pending' })
  status: string; // 'pending', 'processing', 'completed', 'failed'

  @Column({ type: 'timestamp', nullable: true })
  last_attempt: Date; // เวลาที่พยายามส่งข้อมูลครั้งล่าสุด

  @Column({ type: 'text', nullable: true })
  error_message: string; // ข้อความ error ถ้ามี

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
