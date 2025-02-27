import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Order } from './order.entity';
import { Menu } from './menu.entity';
import { MenuType } from './menu-type.entity';
import { AddOn } from './add-on.entity';
import { Size } from './size.entity';
import { SweetnessLevel } from './sweetness-level.entity';
import { OrderItemAddOn } from './order-item-add-on.entity';
import { Branch } from './branch.entity';
import { Owner } from './owner.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  order_item_id: number;

  @ManyToOne(() => Order, (order) => order.order_item, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Menu, { nullable: false })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ManyToOne(() => SweetnessLevel, { nullable: false })
  @JoinColumn({ name: 'sweetness_id' })
  sweetnessLevel: SweetnessLevel;

  @ManyToOne(() => MenuType, { nullable: false })
  @JoinColumn({ name: 'menu_type_id' })
  menuType: MenuType;

  @ManyToOne(() => Size, { nullable: false })
  @JoinColumn({ name: 'size_id' })
  size: Size;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(
    () => OrderItemAddOn,
    (orderItemAddOn) => orderItemAddOn.orderItem,
    {
      cascade: true,
    },
  )
  orderItem: OrderItemAddOn[];
}
