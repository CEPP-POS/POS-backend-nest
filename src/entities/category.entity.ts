import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  ManyToMany,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Owner } from './owner.entity';
import { MenuCategory } from './menu_category';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column()
  category_name: string;

  @ManyToOne(() => Owner)
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  // add relation many to many with menu_category
  @ManyToMany(() => Menu, (menu) => menu.categories)
  menus: Menu[];
}
