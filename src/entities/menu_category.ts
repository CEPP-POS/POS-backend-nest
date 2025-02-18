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
  @PrimaryGeneratedColumn()
  menu_category_id: number;

  @ManyToMany(() => Category, (category) => category.menuCategories)
  @JoinTable()  // This creates the join table automatically
  categories: Category[];

  @ManyToMany(() => Menu, (menu) => menu.categories)
  @JoinColumn({ name: 'menu_id' })
  menu: Menu[];
}
