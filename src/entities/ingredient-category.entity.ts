import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity()
export class IngredientCategory {
  @PrimaryGeneratedColumn()
  category_id: number;

  @Column({ unique: true })
  category_name: string;
}
