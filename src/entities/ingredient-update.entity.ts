import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class IngredientUpdate {
  @PrimaryGeneratedColumn()
  update_id: number;

  @ManyToOne(() => Ingredient, { nullable: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column()
  quantity_in_stock: number;

  @Column()
  net_volume: number;

  @Column()
  total_volume: number;

  @CreateDateColumn()
  expiration_date: Date;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
