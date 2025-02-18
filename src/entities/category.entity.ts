import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Owner } from './owner.entity';
import { MenuCategory } from './menu_category';
import { Menu } from './menu.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column()
  category_name: string;

  @ManyToOne(() => Owner)
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(() => MenuCategory, (menuCategory) => menuCategory.category, { cascade: true })
  menuCategory: MenuCategory[];
  // @ManyToMany(() => Menu, (menu) => menu.menuCategory)
  // menus: Menu[];
}
