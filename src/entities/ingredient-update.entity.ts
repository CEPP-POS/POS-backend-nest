import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity()
export class IngredientUpdate {
  @PrimaryGeneratedColumn()
  update_id: number;

  @ManyToOne(() => Ingredient, { nullable: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient_id: Ingredient;

  @Column()
  quantity_in_stock: number;

  @Column()
  net_volume: number;


  @Column()
  total_volume: number;

  @CreateDateColumn()
  expiration_date: Date;
}


