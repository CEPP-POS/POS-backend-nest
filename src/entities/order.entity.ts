import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import {
  CancelStatus,
  PaymentMethod,
} from '../employee-side/order/dto/create-order/create-order.dto';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  order_id: number;

  @CreateDateColumn()
  order_date: Date;

  @Column({
    nullable: true,
    type: 'decimal',
    precision: 10,  // Total digits (including decimals)
    scale: 2,       // Decimal places
    transformer: {
      to: (value: number) => Math.round(value * 100) / 100,  // Round to 2 decimals
      from: (value: string) => parseFloat(value),
    },
  })
  total_price: number;

  @Column()
  queue_number: number;

  @Column({ default: 'รอทำ' }) // สถานะเริ่มต้นเป็น "รอทำ"
  status: string;

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



  @Column({ default: false }) // ✅ ค่าเริ่มต้นเป็น false
  is_paid: boolean;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  order_items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment; // Add this property
}
