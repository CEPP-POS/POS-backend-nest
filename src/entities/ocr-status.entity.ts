import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    JoinColumn,
  } from 'typeorm';
  import { Payment } from './payment.entity';
  
  @Entity()
  export class OcrStatus {
    @PrimaryGeneratedColumn()
    ocr_status_id: number;
  
    @OneToMany(() => Payment, (payment) => payment.payment_id, { nullable: false })
    @JoinColumn({ name: 'payment_id' })
    payment: Payment[];
  
    @Column({
      type: 'enum',
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    })
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
  
    @Column({ type: 'varchar', length: 255 })
    path_img: string;
  }
  