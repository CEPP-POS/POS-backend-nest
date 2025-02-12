import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Menu } from './menu.entity';

@Entity()
export class SweetnessLevel {
  @PrimaryGeneratedColumn()
  sweetness_id: number;

  @Column({ nullable: false })
  level_name: string;

  @Column({ type: 'boolean', default: false })
  is_required: boolean;

  @ManyToOne(() => Menu, (menu) => menu.sweetnessLevels, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;
}
