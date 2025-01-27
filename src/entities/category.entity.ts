import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
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

  @OneToMany(() => Menu, (menu) => menu.category)
  @JoinColumn({ name: 'menu_id' })
  menu: Menu[];
}
