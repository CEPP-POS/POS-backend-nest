import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Size } from './size.entity';
import { Menu } from './menu.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class SizeGroup {
  @PrimaryGeneratedColumn()
  size_group_id: number;

  @Column()
  size_group_name: string;

  @ManyToOne(() => Size, { nullable: false })
  @JoinColumn({ name: 'size_id' })
  size: Size;

  @OneToMany(() => Menu, (menu) => menu.sizeGroup, {
    cascade: true,
  })
  menu: Menu[];

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
