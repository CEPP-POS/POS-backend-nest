import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  CancelStatus,
  PaymentMethod,
} from '../employee-side/order/dto/create-order/create-order.dto';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { Branch } from './branch.entity';
import { LocalData } from './local-data.entity';
import { Owner } from './owner.entity';

@Entity()
export class Order {
  
  @PrimaryGeneratedColumn()
  order_id: number;

  @CreateDateColumn()
  order_date: Date;


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

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Owner, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  order_item: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment; // Add this property

  @OneToOne(() => LocalData, (localData) => localData.order, { cascade: true })
  local_data: LocalData;
}
