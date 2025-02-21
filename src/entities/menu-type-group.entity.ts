import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MenuType } from './menu-type.entity';
import { Menu } from './menu.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class MenuTypeGroup {
  @PrimaryGeneratedColumn()
  menu_type_group_id: number;

  @Column()
  menu_type_group_name: string;

  @ManyToOne(() => MenuType, { nullable: false })
  @JoinColumn({ name: 'menu_type_id' })
  menuType: MenuType;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => Menu, (menu) => menu.menuTypeGroup, {
    cascade: true,
  })
  menu: Menu[];
}
