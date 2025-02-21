import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { SizeGroup } from './size-group.entity';
import { OrderItem } from './order-item.entity';
import { MenuIngredient } from './menu-ingredient.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

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

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

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
