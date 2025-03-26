import {
  Entity,
  Column,
  PrimaryColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Owner } from './owner.entity';
import { MenuCategory } from './menu_category';
import { Branch } from './branch.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Category {
  @PrimaryColumn({ type: 'uuid', default: () => `'${uuidv4()}'` })
  category_id: string;

  @Column()
  category_name: string;

  @ManyToOne(() => Owner)
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => MenuCategory, (menuCategory) => menuCategory.category, {
    cascade: true,
  })
  menuCategory: MenuCategory[];
}
