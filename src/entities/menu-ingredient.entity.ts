import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';
import { Menu } from './menu.entity';
import { Ingredient } from './ingredient.entity';
import { Size } from './size.entity';
import { SweetnessLevel } from './sweetness-level.entity';
import { AddOn } from './add-on.entity';
import { MenuType } from './menu-type.entity';

@Entity()
export class MenuIngredient {
    @PrimaryGeneratedColumn()
    menu_ingredient_id: number;

    @ManyToOne(() => Menu, { nullable: false })
    @JoinColumn({ name: 'menu_id' })
    menu_id: Menu;

    @ManyToOne(() => Ingredient, { nullable: true })
    @JoinColumn({ name: 'ingredient_id' })
    ingredient_id: Ingredient;

    @ManyToOne(() => Size, { nullable: true })
    @JoinColumn({ name: 'size_id' })
    size_id: Size;

    @ManyToOne(() => SweetnessLevel, { nullable: true })
    @JoinColumn({ name: 'sweetness_id' })
    sweetness_id: SweetnessLevel;

    @ManyToOne(() => MenuType, { nullable: true })
    @JoinColumn({ name: 'menu_type_id' })
    menu_type_id: MenuType;

    @Column()
    quantity_used: number;

    // for success connect one to many in add on 
    // Each MenuIngredient can have only one AddOn
    @ManyToOne(() => AddOn, (addOn) => addOn.menu_ingredients_id, { nullable: true })
    @JoinColumn({ name: 'add_on_id' })
    add_on: AddOn;
}
