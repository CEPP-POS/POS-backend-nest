import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Menu } from './menu.entity';
import { SweetnessGroup } from './sweetness-group.entity';
import { OrderItem } from './order-item.entity';

@Entity()
export class SweetnessLevel {
  @PrimaryGeneratedColumn()
  sweetness_id: number;

  @Column({ nullable: false })
  level_name: string;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @OneToMany(
    () => SweetnessGroup,
    (sweetnessGroup) => sweetnessGroup.sweetnessLevel,
    {
      cascade: true,
    },
  )
  sweetnessGroup: SweetnessGroup[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.sweetnessLevel, {
    cascade: true,
  })
  orderItem: OrderItem[];
}
