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

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  ingredient_id: number;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner_id: Owner;

  @Column()
  ingredient_name: string;

  @ManyToOne(() => IngredientCategory)
  @JoinColumn({ name: 'category_id' })
  category_id: IngredientCategory;

  @OneToMany(
    () => IngredientUpdate,
    (ingredientUpdate) => ingredientUpdate.ingredient_id,
    { cascade: true },
  )
  ingredientUpdate: IngredientUpdate[]; // เพิ่มความสัมพันธ์กับ AddOn

  // for success connect one to many in ingredient menu link
  @ManyToOne(
    () => IngredientMenuLink,
    (ingredientMenuLink) => ingredientMenuLink.link_id,
    { nullable: true },
  )
  @JoinColumn({ name: 'link_id' })
  ingredientMenuLink: IngredientMenuLink;
}
