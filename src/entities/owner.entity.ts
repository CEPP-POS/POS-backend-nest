import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { MenuIngredient } from './menu-ingredient.entity';
import { Branch } from './branch.entity';
import { SalesSummary } from './sales-summary.entity';
import { Menu } from './menu.entity';
import { Category } from './category.entity';
import { MenuCategory } from './menu_category';

@Entity()
export class Owner {
  @PrimaryGeneratedColumn()
  owner_id: number;

  @Column({ type: 'varchar', length: 255 })
  owner_name: string;

  @Column({ type: 'varchar', length: 255 })
  contact_info: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  otp_expiry: Date;

  @Column({ default: 'user' })
  role: string;

  @OneToMany(() => MenuIngredient, (menuIngredient) => menuIngredient.owner, {
    cascade: true,
  })
  menuIngredient: MenuIngredient[];

  @OneToMany(() => Branch, (branch) => branch.owner, { cascade: true })
  branch: Branch[];

  @OneToMany(() => SalesSummary, (salesSummary) => salesSummary.owner, {
    cascade: true,
  })
  salesSummary: SalesSummary[];

  @OneToMany(() => Menu, (menu) => menu.owner, { cascade: true })
  menu: Menu[];

  @OneToMany(() => Category, (category) => category.owner, { cascade: true })
  category: Category[];

  @OneToMany(() => MenuCategory, (menuCategory) => menuCategory.owner, {
    cascade: true,
  })
  menuCategory: MenuCategory[];
}
