import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Exclude } from 'class-transformer';
import { SizeGroup } from './size-group.entity';
import { OrderItem } from './order-item.entity';
import { MenuIngredient } from './menu-ingredient.entity';

@Entity()
export class Size {
  @PrimaryGeneratedColumn()
  size_id: number;

  @Column({ nullable: false })
  size_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  size_price: number;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @OneToMany(() => SizeGroup, (sizeGroup) => sizeGroup.size, {
    cascade: true,
  })
  sizeGroup: SizeGroup[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.size, {
    cascade: true,
  })
  orderItem: OrderItem[];

  @OneToMany(() => MenuIngredient, (menuIngredient) => menuIngredient.size, {
    cascade: true,
  })
  menuIngredient: MenuIngredient[];
}
