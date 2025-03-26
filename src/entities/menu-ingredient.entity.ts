import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Menu } from './menu.entity';
import { Ingredient } from './ingredient.entity';
import { Size } from './size.entity';
import { MenuType } from './menu-type.entity';
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class MenuIngredient {
  @PrimaryColumn({ type: 'uuid', default: () => `'${uuidv4()}'` })
  menu_ingredient_id: string;

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

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
