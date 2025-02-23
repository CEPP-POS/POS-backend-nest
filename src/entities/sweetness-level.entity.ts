import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { SweetnessGroup } from './sweetness-group.entity';
import { OrderItem } from './order-item.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class SweetnessLevel {
  @PrimaryGeneratedColumn()
  sweetness_id: number;

  @Column({ nullable: false })
  level_name: string;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

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
