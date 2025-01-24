import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { IngredientCategory } from './ingredient-category.entity';
import { Owner } from './owner.entity';
import { IngredientMenuLink } from './ingredient-menu-link.entity';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  ingredient_id: number;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner_id: Owner;

  @Column()
  ingredient_name: string;

  @Column()
  net_volume: number;

  @Column()
  quantity_in_stock: number;

  @Column()
  total_volume: number;

  @Column({ nullable: true })
  unit: string;

  @ManyToOne(() => IngredientCategory)
  @JoinColumn({ name: 'category_id' })
  category_id: IngredientCategory;

  @CreateDateColumn()
  expiration_date: Date;

  // for success connect one to many in ingredient menu link
  @ManyToOne(
    () => IngredientMenuLink,
    (ingredientMenuLink) => ingredientMenuLink.link_id,
    { nullable: true },
  )
  @JoinColumn({ name: 'link_id' })
  ingredientMenuLink: IngredientMenuLink;
}
