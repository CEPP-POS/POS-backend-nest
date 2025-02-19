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

@Entity()
export class MenuTypeGroup {
  @PrimaryGeneratedColumn()
  menu_type_group_id: number;

  @Column()
  menu_type_group_name: string;

  @ManyToOne(() => MenuType, { nullable: false })
  @JoinColumn({ name: 'menu_type_id' })
  menuType: MenuType;

  @OneToMany(() => Menu, (menu) => menu.menuTypeGroup, {
    cascade: true,
  })
  menu: Menu[];
}
