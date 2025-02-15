import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Order } from './order.entity';
import { Menu } from './menu.entity';
import { MenuType } from './menu-type.entity';
import { AddOn } from './add-on.entity';
import { Size } from './size.entity';
import { SweetnessLevel } from './sweetness-level.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  order_item_id: number;

  @ManyToOne(() => Order, (order) => order.order_item, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Menu, { nullable: false })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ManyToOne(() => SweetnessLevel, { nullable: false })
  @JoinColumn({ name: 'sweetness_id' })
  sweetness: SweetnessLevel;

  @ManyToOne(() => MenuType, { nullable: false })
  @JoinColumn({ name: 'menu_type_id' })
  menu_type: MenuType;

  @ManyToMany(() => AddOn, { cascade: true })
  @JoinTable({
    name: 'order_item_add_ons',
    joinColumn: {
      name: 'order_item_id',
      referencedColumnName: 'order_item_id',
    },
    inverseJoinColumn: { name: 'add_on_id', referencedColumnName: 'add_on_id' },
  })
  addOns: AddOn[];

  @ManyToOne(() => Size, { nullable: false })
  @JoinColumn({ name: 'size_id' })
  size: Size;

  @Column()
  quantity: number;

  @Column()
  price: number;
}
