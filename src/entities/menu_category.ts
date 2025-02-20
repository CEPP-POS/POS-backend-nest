import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryColumn,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Category } from './category.entity';
import { Branch } from './branch.entity';
import { Owner } from './owner.entity';

@Entity()
export class MenuCategory {
  @PrimaryColumn()
  category_id: number;

  @PrimaryColumn()
  menu_id: number;

  @PrimaryColumn()
  owner_id: number;

  @PrimaryColumn()
  branch_id: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Menu, { nullable: true })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ManyToOne(() => Owner, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
