import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class IngredientCategory {
  @PrimaryGeneratedColumn()
  ingredient_category_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  ingredient_category_name: string;

  @OneToMany(() => Ingredient, (Ingredient) => Ingredient.ingredientCategory, {
    onDelete: 'CASCADE',
  })
  ingredient: Ingredient[]; // เพิ่มความสัมพันธ์กับ Ingredient_Category

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
