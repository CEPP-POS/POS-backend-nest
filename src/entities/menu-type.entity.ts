import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { MenuTypeGroup } from './menu-type-group.entity';
import { MenuIngredient } from './menu-ingredient.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class MenuType {
  @PrimaryGeneratedColumn()
  menu_type_id: number;

  @Column()
  type_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_difference: number;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.menuType, {
    cascade: true,
  })
  orderItem: OrderItem[];

  @OneToMany(() => MenuTypeGroup, (menuTypeGroup) => menuTypeGroup.menuType, {
    cascade: true,
  })
  menuTypeGroup: MenuTypeGroup[];

  @OneToMany(
    () => MenuIngredient,
    (menuIngredient) => menuIngredient.menu_type,
    {
      cascade: true,
    },
  )
  menuIngredient: MenuIngredient[];
}
