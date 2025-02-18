import {
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';

@Entity()
export class MenuType {
  @PrimaryGeneratedColumn()
  menu_type_id: number;

  @Column()
  type_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_difference: number;
}
