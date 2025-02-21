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
import { Owner } from './owner.entity';
import { Branch } from './branch.entity';

@Entity()
export class OrderItemAddOn {
    // @PrimaryGeneratedColumn()
    // order_item_add_on_id: number;
    @PrimaryColumn()
    order_item_id: number

    @PrimaryColumn()
    ingredient_id: number

    @ManyToOne(() => OrderItem, { nullable: true })
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;

    @ManyToOne(() => Ingredient, { nullable: true })
    @JoinColumn({ name: 'ingredient_id' })
    ingredient: Ingredient;

    @ManyToOne(() => Owner, { nullable: true })
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @ManyToOne(() => Branch, { nullable: true })
    @JoinColumn({ name: 'branch_id' })
    branch: Branch;
}