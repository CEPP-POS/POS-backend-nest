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
import { MenuTypeGroup } from './menu-type-group.entity';
import { SweetnessGroup } from './sweetness-group.entity';
import { SizeGroup } from './size-group.entity';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn()
  menu_id: number;

  // @ManyToOne(() => Category, { nullable: true })
  // @JoinColumn({ name: 'category_id' })
  // category: Category;

  // edit entity
  // @ManyToMany(() => Category, (category) => category.menu, { cascade: true })
  // @JoinTable() // ✅ ให้ TypeORM สร้างตารางเชื่อมกลาง (menu_categories)
  // categories: Category[];

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

  @ManyToOne(() => MenuTypeGroup, { nullable: false })
  @JoinColumn({ name: 'menu_type_group_id' })
  menuTypeGroup: MenuTypeGroup;

  @ManyToOne(() => SweetnessGroup, { nullable: false })
  @JoinColumn({ name: 'sweetness_group_id' })
  sweetnessGroup: SweetnessGroup;

  @ManyToOne(() => SizeGroup, { nullable: false })
  @JoinColumn({ name: 'size_group_id' })
  sizeGroup: SizeGroup;

  // link Many-to-Many relationship with menu category table
  @ManyToMany(() => Category, (category) => category.menus, { cascade: true })
  @JoinTable({
    name: 'menu_category',
    joinColumn: { name: 'menu_id', referencedColumnName: 'menu_id' }, // Custom FK column for Menu
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'category_id' }, // Custom FK column for Category
  })
  categories: Category[];

  // remove unused entity
  // @OneToMany(() => Size, (size) => size.menu, { cascade: true })
  // sizes: Size[];

  // @OneToMany(() => AddOn, (addOn) => addOn.menu, { cascade: true })
  // addOns: AddOn[];
  // เพิ่มความสัมพันธ์กับ AddOn

  // edit entity sweetness
  // @OneToMany(() => SweetnessLevel, (sweetnessLevel) => sweetnessLevel.menu, {
  //   cascade: true,
  // })
  // sweetnessLevels: SweetnessLevel[];

  // edit entity
  // @OneToMany(() => MenuType, (menuType) => menuType.menu, {
  //   cascade: true,
  //   eager: true,
  // })
  // menuTypes: MenuType[];
}
