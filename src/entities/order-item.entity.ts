import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Menu } from 'src/entities/menu.entity';
import { MenuType } from 'src/entities/menu-type.entity';
import { AddOn } from 'src/entities/add-on.entity';
import { Size } from 'src/entities/size.entity';
import { SweetnessLevel } from 'src/entities/sweetness-level.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  order_item_id: number;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order_id: Order;

  //menu_id link with table menu
  @ManyToOne(() => Menu, { nullable: true })
  @JoinColumn({ name: 'menu_id' })
  menu_id: Menu;

  //sweetness_id link with table sweetness
  @ManyToOne(() => SweetnessLevel, { nullable: true })
  @JoinColumn({ name: 'sweetness_id' })
  sweetness_id: SweetnessLevel;

  //MenuType_id link with table type
  @ManyToOne(() => MenuType, { nullable: true })
  @JoinColumn({ name: 'menu_type_id' })
  menu_type_id: MenuType;

  //add_on_id link with table add on
  @ManyToOne(() => AddOn, { nullable: true })
  @JoinColumn({ name: 'add_on_id' })
  add_on_id: AddOn[];

  //size_id link with table size
  @ManyToOne(() => Size, { nullable: true })
  @JoinColumn({ name: 'size_id' })
  size_id: Size;

  @Column()
  quantity: number; //จำนวนสินค้าที่เพิ่ม

  @Column()
  price: number; //ราคา
}
