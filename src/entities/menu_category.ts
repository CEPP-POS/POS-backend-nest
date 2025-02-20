import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Menu } from './menu.entity';
import { Category } from './category.entity';
import { Branch } from './branch.entity';
import { Owner } from '../owner-side/owner/entity/owner.entity';

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

  @ManyToOne(() => Category, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Menu, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
