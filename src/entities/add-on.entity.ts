import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

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

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
