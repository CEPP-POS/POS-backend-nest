import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Ingredient } from './ingredient.entity';

@Entity()
export class IngredientMenuLink {
    @PrimaryGeneratedColumn()
    link_id: number;

    @ManyToOne(() => Menu, { nullable: false })
    @JoinColumn({ name: 'menu_id' })
    menu_id: Menu;

    @OneToMany(() => Ingredient, (ingredient) => ingredient.ingredient_id)
    @JoinColumn({ name: 'ingredient_id' })
    ingredient_id: Ingredient;
}
