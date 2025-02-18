import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Size {
  @PrimaryGeneratedColumn()
  size_id: number;

  @Column()
  size_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  size_price: number;

  @Column({ type: 'boolean', default: false })
  is_required: boolean;

  @ManyToOne(() => Menu, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  @Exclude()
  menu: Menu;
}
