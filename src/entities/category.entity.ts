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

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column()
  category_name: string;

  @ManyToOne(() => Owner)
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  // edit entity
  // @ManyToMany(() => Menu, (menu) => menu.categories)
  // @JoinColumn({ name: 'menu_id' })
  // menu: Menu[];
}
