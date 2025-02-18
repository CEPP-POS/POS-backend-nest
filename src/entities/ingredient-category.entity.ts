import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity()
export class IngredientCategory {
  @PrimaryGeneratedColumn()
  ingredient_category_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  ingredient_category_name: string;

  @OneToMany(() => Ingredient, (Ingredient) => Ingredient.ingredientCategory, {
    cascade: true,
  })
  ingredient: Ingredient[]; // เพิ่มความสัมพันธ์กับ Ingredient_Category
}
