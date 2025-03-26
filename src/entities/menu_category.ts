import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Menu } from './menu.entity';
import { Category } from './category.entity';
import { Branch } from './branch.entity';
import { Owner } from './owner.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class MenuCategory {
  @PrimaryColumn({ type: 'uuid', default: () => `'${uuidv4()}'` })
  category_id: string;

  @PrimaryColumn()
  menu_id: string;

  @PrimaryColumn()
  owner_id: string;

  @PrimaryColumn()
  branch_id: string;

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
