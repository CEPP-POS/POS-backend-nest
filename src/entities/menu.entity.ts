import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { Owner } from './owner.entity';
import { Category } from './category.entity';
import { Branch } from './branch.entity';
import { Size } from './size.entity';
import { AddOn } from 'src/entities/add-on.entity';
import { SweetnessLevel } from './sweetness-level.entity';
import { MenuType } from './menu-type.entity';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn()
  menu_id: number;

  @Column()
  store_id: number;

  @ManyToMany(() => Category, (category) => category.menu, { cascade: true })
  @JoinTable() // ✅ ให้ TypeORM สร้างตารางเชื่อมกลาง (menu_categories)
  categories: Category[];

  @Column()
  menu_name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'boolean', default: false })
  paused: boolean;

  @OneToMany(() => Size, (size) => size.menu, { cascade: true })
  sizes: Size[];


  @OneToMany(() => SweetnessLevel, (sweetnessLevel) => sweetnessLevel.menu, {
    cascade: true,
  })
  sweetnessLevels: SweetnessLevel[];

  @OneToMany(() => MenuType, (menuType) => menuType.menu, {
    cascade: true,
    eager: true,
  })
  menuTypes: MenuType[];
}
