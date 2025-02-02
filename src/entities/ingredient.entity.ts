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

    @ManyToOne(() => Owner, { nullable: true })
    @JoinColumn({ name: 'owner_id' })
    owner_id: Owner;

    @Column()
    ingredient_name: string;

    @Column({ nullable: true })
    net_volume: number;

    @Column({ nullable: true })
    quantity_in_stock: number;

    @Column({ nullable: true })
    total_volume: number;

    @Column({ nullable: true })
    unit: string;

    @Column({ type: "boolean", default: false })
    paused: boolean;

    @ManyToOne(() => IngredientCategory)
    @JoinColumn({ name: 'category_id' })
    category_id: IngredientCategory;

    @OneToMany(
        () => IngredientUpdate,
        (ingredientUpdate) => ingredientUpdate.ingredient_id,
        { cascade: true },
    )

    ingredientUpdate: IngredientUpdate[]; // เพิ่มความสัมพันธ์กับ AddOn
    @CreateDateColumn({ nullable: true })
    expiration_date: Date;

    // for success connect one to many in ingredient menu link 
    @ManyToOne(() => IngredientMenuLink, (ingredientMenuLink) => ingredientMenuLink.link_id, { nullable: true })
    @JoinColumn({ name: 'link_id' })
    ingredientMenuLink: IngredientMenuLink;
}
