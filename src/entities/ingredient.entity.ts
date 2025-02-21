import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { IngredientCategory } from './ingredient-category.entity';
import { IngredientUpdate } from './ingredient-update.entity';
import { Branch } from './branch.entity';
import { OrderItemAddOn } from './order-item-add-on.entity';
import { Owner } from './owner.entity';

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

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @ManyToOne(() => Owner, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(
    () => IngredientUpdate,
    (ingredientUpdate) => ingredientUpdate.ingredient,
    { cascade: true },
  )
  @OneToMany(
    () => OrderItemAddOn,
    (orderItemAddon) => orderItemAddon.ingredient,
    { cascade: true },
  )
  ingredientUpdate: IngredientUpdate[]; // เพิ่มความสัมพันธ์กับ AddOn
}
