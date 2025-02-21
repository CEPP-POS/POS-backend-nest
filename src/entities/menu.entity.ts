import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';
import { MenuTypeGroup } from './menu-type-group.entity';
import { SweetnessGroup } from './sweetness-group.entity';
import { SizeGroup } from './size-group.entity';
import { MenuIngredient } from './menu-ingredient.entity';
import { OrderItem } from './order-item.entity';
import { MenuCategory } from './menu_category';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn()
  menu_id: number;

  @Column()
  menu_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'boolean', default: false })
  paused: boolean;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @ManyToOne(() => MenuTypeGroup, { nullable: true })
  @JoinColumn({ name: 'menu_type_group_name' })
  menuTypeGroup: MenuTypeGroup;

  @ManyToOne(() => SweetnessGroup, { nullable: true })
  @JoinColumn({ name: 'sweetness_group_name' })
  sweetnessGroup: SweetnessGroup;

  @ManyToOne(() => SizeGroup, { nullable: true })
  @JoinColumn({ name: 'size_group_name' })
  sizeGroup: SizeGroup;

  @OneToMany(() => MenuIngredient, (menuIngredient) => menuIngredient.menu, {
    cascade: true,
  })
  menuIngredient: MenuIngredient[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.menu, {
    cascade: true,
  })
  orderItem: OrderItem[];

  @OneToMany(() => MenuCategory, (menuCategory) => menuCategory.menu, {
    cascade: true,
  })
  menuCategory: MenuCategory[];
}
