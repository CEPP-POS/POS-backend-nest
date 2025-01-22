import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Menu } from './menu.entity';

@Entity()
export class AddOn {
  @PrimaryGeneratedColumn()
  add_on_id: number;

  @Column()
  add_on_name: string;

  @Column({ type: 'boolean', default: false })
  is_required: boolean;

  @Column({ type: 'boolean', default: false })
  is_multipled: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // @OneToMany(() => MenuIngreduent, { nullable: false })
  // @JoinColumn({ name: 'menu_ingredient_id' })
  // menu_ingredient_id: MenuIngreduent;

  @ManyToOne(() => Menu, (menu) => menu.addOns, { nullable: false })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;
}
