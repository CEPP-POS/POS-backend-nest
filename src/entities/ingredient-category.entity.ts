import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity()
export class IngredientCategory {
    @PrimaryGeneratedColumn()
    category_id: number;

    @Column()
    category_name: string;
}
