import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Menu } from './menu.entity';
import { MenuIngredient } from './menu-ingredient.entity';
import { Ingredient } from './ingredient.entity';

@Entity()
export class AddOn {
  @PrimaryGeneratedColumn()
  add_on_id: number;

  @ManyToOne(() => Ingredient, { nullable: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ type: 'boolean', default: false })
  is_required: boolean;

  @Column({ type: 'boolean', default: false })
  is_multipled: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  add_on_price: number;
}
