import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { MenuIngredient } from './menu-ingredient.entity';
import { Branch } from './branch.entity';
import { SalesSummary } from './sales-summary.entity';
import { Menu } from './menu.entity';
import { Category } from './category.entity';

@Entity()
export class Owner {
  @PrimaryGeneratedColumn()
  owner_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_info: string;

  @Column({ nullable: true })
  otp: string;

  @Column('text', { array: true, default: () => "ARRAY['owner']" })
  roles: string[];

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
}
