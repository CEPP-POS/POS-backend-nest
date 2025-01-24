import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany
} from 'typeorm';
import { Menu } from './menu.entity';
import { MenuIngredient } from './menu-ingredient.entity';

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

  @Column({ nullable: true })
  unit: string;

  @OneToMany(() => MenuIngredient, (menuIngredient) => menuIngredient.add_on)
  menu_ingredients_id: MenuIngredient[];

  @ManyToOne(() => Menu, (menu) => menu.addOns)
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;
}
