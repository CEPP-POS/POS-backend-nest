import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { Owner } from './owner.entity';
import { Category } from './category.entity';
import { Branch } from './branch.entity';
import { Size } from './size.entity';
import { AddOn } from 'src/entities/add-on.entity';
import { SweetnessLevel } from './sweetness-level.entity';
import { MenuType } from './menu-type.entity';
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

  @ManyToOne(() => MenuTypeGroup, { nullable: true })
  @JoinColumn({ name: 'menu_type_group_id' })
  menuTypeGroup: MenuTypeGroup;

  @ManyToOne(() => SweetnessGroup, { nullable: true })
  @JoinColumn({ name: 'sweetness_group_id' })
  sweetnessGroup: SweetnessGroup;

  @ManyToOne(() => SizeGroup, { nullable: true })
  @JoinColumn({ name: 'size_group_id' })
  sizeGroup: SizeGroup;

  @OneToMany(() => MenuIngredient, (menuIngredient) => menuIngredient.menu, {
    cascade: true,
  })
  menuIngredient: MenuIngredient[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.menu, {
    cascade: true,
  })
  orderItem: OrderItem[];

  @ManyToMany(() => MenuCategory, (menuCategory) => menuCategory.menu)
  @JoinTable({
    name: 'menu_menu_category',
    joinColumn: { name: 'menu_id', referencedColumnName: 'menu_id' },
    inverseJoinColumn: {
      name: 'menu_category_id',
      referencedColumnName: 'menu_category_id',
    },
  })
  menuCategory: MenuCategory[];
}
