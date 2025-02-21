import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { SweetnessLevel } from './sweetness-level.entity';
import { Menu } from './menu.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class SweetnessGroup {
  // @PrimaryGeneratedColumn()
  // sweetness_group_id: number;

  @PrimaryColumn()
  sweetness_group_name: string;

  @PrimaryColumn()
  sweetness_id: number;
  
  @ManyToOne(() => SweetnessLevel, { nullable: false })
  @JoinColumn({ name: 'sweetness_id' })
  sweetnessLevel: SweetnessLevel;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => Menu, (menu) => menu.sweetnessGroup, {
    cascade: true,
  })
  menu: Menu[];
}
