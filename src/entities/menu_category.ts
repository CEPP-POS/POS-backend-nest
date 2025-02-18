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

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToMany(() => Menu, (menu) => menu.menuCategory)
  menu: Menu[];
}
