import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Ingredient } from './ingredient.entity';
import { Size } from './size.entity';
import { SweetnessLevel } from './sweetness-level.entity';
import { AddOn } from './add-on.entity';
import { MenuType } from './menu-type.entity';
import { Owner } from './owner.entity';

@Entity()
export class MenuIngredient {
  @PrimaryGeneratedColumn()
  menu_ingredient_id: number;

  @ManyToOne(() => Menu, { nullable: false })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ManyToOne(() => Ingredient, { nullable: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @ManyToOne(() => Size, { nullable: true })
  @JoinColumn({ name: 'size_id' })
  size: Size;

  @Column()
  is_addon: boolean;

  @ManyToOne(() => MenuType, { nullable: true })
  @JoinColumn({ name: 'menu_type_id' })
  menu_type: MenuType;

  @Column()
  quantity_used: number;

  @ManyToOne(() => Owner, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;
}
