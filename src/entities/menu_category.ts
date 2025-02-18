import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Owner } from './owner.entity';
import { Category } from './category.entity';

@Entity()
export class MenuCategory {
  // @PrimaryGeneratedColumn()
  // menu_category_id: number;

  @ManyToMany(() => Category, (category) => category.category_id)
  @JoinTable()  // This creates the join table automatically
  category: Category[];

  @ManyToMany(() => Menu, (menu) => menu.menu_id)
  @JoinTable()
  menu: Menu[];
}
