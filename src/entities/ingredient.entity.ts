import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { IngredientCategory } from './ingredient-category.entity';
import { Owner } from './owner.entity';
import { IngredientMenuLink } from './ingredient-menu-link.entity';
import { IngredientUpdate } from './ingredient-update.entity';
import { Branch } from './branch.entity';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  ingredient_id: number;

  @Column()
  ingredient_name: string;

  @ManyToOne(() => IngredientCategory)
  @JoinColumn({ name: 'category_id' })
  ingredientCategory: IngredientCategory;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  unit: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'boolean', default: false })
  paused: boolean;

  @OneToMany(
    () => IngredientUpdate,
    (ingredientUpdate) => ingredientUpdate.ingredient,
    { cascade: true },
  )
  ingredientUpdate: IngredientUpdate[]; // เพิ่มความสัมพันธ์กับ AddOn
}
