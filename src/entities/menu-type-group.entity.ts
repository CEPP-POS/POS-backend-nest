import {
  Entity,
  PrimaryColumn,
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
  @PrimaryColumn({ type: 'uuid' })
  menu_type_group_id: string;

  @Column()
  menu_type_group_name: string;

  @ManyToOne(() => MenuType, { nullable: true })
  @JoinColumn({ name: 'menu_type_id' })
  menuType: MenuType;

  @ManyToOne(() => Owner, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => Menu, (menu) => menu.menuTypeGroup, {
    cascade: true,
  })
  menu: Menu[];
}
