import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryColumn,
} from 'typeorm';
import { MenuType } from './menu-type.entity';
import { OrderItem } from './order-item.entity';
import { Ingredient } from './ingredient.entity';

@Entity()
export class OrderItemAddOn {
    // @PrimaryGeneratedColumn()
    // order_item_add_on_id: number;
    @PrimaryColumn()
    order_item_id: number

    @ManyToOne(() => OrderItem, { nullable: true })
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;

    @PrimaryColumn()
    ingredient_id: number

    @ManyToOne(() => Ingredient, { nullable: true })
    @JoinColumn({ name: 'ingredient_id' })
    ingredient: Ingredient;
}

