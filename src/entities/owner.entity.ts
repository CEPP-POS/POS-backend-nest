import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { MenuIngredient } from './menu-ingredient.entity';
import { Branch } from './branch.entity';
import { SalesSummary } from './sales-summary.entity';
import { Menu } from './menu.entity';
import { Category } from './category.entity';
import { Payment } from './payment.entity';
import { Order } from './order.entity';
import { Ingredient } from './ingredient.entity';
import { OrderItem } from './order-item.entity';
import { SizeGroup } from './size-group.entity';
import { Size } from './size.entity';
import { SweetnessGroup } from './sweetness-group.entity';
import { SweetnessLevel } from './sweetness-level.entity';
import { MenuType } from './menu-type.entity';
import { LocalData } from './local-data.entity';
import { SyncStatus } from './sync-status.entity';
@Entity()
export class Owner {
  @PrimaryColumn({ type: 'uuid' })
  owner_id: string;

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

  @Column({ type: 'timestamp', nullable: true })
  otp_expiry: Date;

  @Column('text', { array: true, default: () => "ARRAY['owner']" })
  roles: string[];

  @OneToMany(() => Owner, (employee) => employee.manager, { cascade: true })
  employees: Owner[];

  @ManyToOne(() => Owner, (owner) => owner.employees, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: Owner;

  @Column({ nullable: true })
  branch_id: string;

  @ManyToOne(() => Branch, (branch) => branch.owner, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @OneToMany(() => MenuIngredient, (menuIngredient) => menuIngredient.owner, {
    cascade: true,
  })
  menuIngredient: MenuIngredient[];

  @OneToMany(() => SalesSummary, (salesSummary) => salesSummary.owner, {
    cascade: true,
  })
  salesSummary: SalesSummary[];

  @OneToMany(() => Menu, (menu) => menu.owner, { cascade: true })
  menu: Menu[];

  @OneToMany(() => Category, (category) => category.owner, { cascade: true })
  category: Category[];

  @OneToMany(() => Payment, (payment) => payment.owner, { cascade: true })
  payment: Payment[];

  @OneToMany(() => Order, (order) => order.owner, { cascade: true })
  order: Order[];

  @OneToMany(() => Ingredient, (ingredient) => ingredient.owner, {
    cascade: true,
  })
  ingredient: Ingredient[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.owner, { cascade: true })
  orderItem: OrderItem[];

  @OneToMany(() => SizeGroup, (sizeGroup) => sizeGroup.owner, { cascade: true })
  sizeGroup: SizeGroup[];

  @OneToMany(() => Size, (size) => size.owner, { cascade: true })
  size: Size[];

  @OneToMany(() => SweetnessGroup, (sweetnessGroup) => sweetnessGroup.owner, {
    cascade: true,
  })
  sweetnessGroup: SweetnessGroup[];

  @OneToMany(() => SweetnessLevel, (sweetnessLevel) => sweetnessLevel.owner, {
    cascade: true,
  })
  sweetnessLevel: SweetnessLevel[];

  @OneToMany(() => MenuType, (menuType) => menuType.owner, { cascade: true })
  menuType: MenuType[];

  @OneToMany(() => LocalData, (localData) => localData.owner, { cascade: true })
  localData: LocalData[];

  @OneToMany(() => SyncStatus, (syncStatus) => syncStatus.owner, {
    cascade: true,
  })
  syncStatus: SyncStatus[];
}
