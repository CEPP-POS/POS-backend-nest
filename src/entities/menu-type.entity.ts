import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Menu } from './menu.entity';

@Entity()
export class MenuType {
  @PrimaryGeneratedColumn()
  menu_type_id: number;

  @Column()
  type_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_difference: number;

  @Column({ type: 'boolean', default: false })
  is_required: boolean;

  @ManyToOne(() => Menu, { nullable: true })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;
}
