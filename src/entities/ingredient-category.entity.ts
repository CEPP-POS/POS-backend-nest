import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity()
export class IngredientCategory {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  category_name: string;

  @OneToMany(() => Ingredient, (Ingredient) => Ingredient.ingredientCategory, {
    cascade: true,
  })
  ingredient: Ingredient[]; // เพิ่มความสัมพันธ์กับ Ingredient_Category
}
