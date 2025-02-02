import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { CancelStatus } from '../employee-side/order/dto/create-order/create-order.dto';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  order_id: number;

  @CreateDateColumn()
  order_date: Date;

  @Column({ nullable: true })
  total_price: number;

  @Column()
  queue_number: number;

  @Column({ default: 'รอทำ' }) // สถานะเริ่มต้นเป็น "รอทำ"
  status: string;

  @Column({ nullable: true })
  customer_id: number; // ไอดีลูกค้า

  @Column({ nullable: true })
  customer_name: string; // ชื่อลูกค้า

  @Column({ nullable: true })
  customer_contact: string; // เบอร์โทรลูกค้า

  @Column({
    type: 'enum',
    enum: CancelStatus,
    default: CancelStatus.RefundPending,
    nullable: true,
  })
  cancel_status: CancelStatus;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order_id)
  orderItems: OrderItem[]; // Add this for the reverse relation

  
  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment; // Add this property
}
