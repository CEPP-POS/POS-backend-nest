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

@Entity()
export class MenuIngredient {
    @PrimaryGeneratedColumn()
    menu_ingredient_id: number;

    @ManyToOne(() => Menu, { nullable: false })
    @JoinColumn({ name: 'menu_id' })
    menu_id: Menu;

    @ManyToOne(() => Ingredient, { nullable: false })
    @JoinColumn({ name: 'ingredient_id' })
    ingredient_id: Ingredient;

    @ManyToOne(() => Size, { nullable: false })
    @JoinColumn({ name: 'size_id' })
    size_id: Size;

    @ManyToOne(() => SweetnessLevel, { nullable: false })
    @JoinColumn({ name: 'sweetness_id' })
    sweetness_id: SweetnessLevel;

    @Column()
    quantity_used: number;
}
