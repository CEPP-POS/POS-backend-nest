import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { MenuIngredient } from './menu-ingredient.entity';
import { Branch } from './branch.entity';
import { SalesSummary } from './sales-summary.entity';
import { Menu } from './menu.entity';
import { Category } from './category.entity';
import { MenuCategory } from './menu_category';
import { Payment } from './payment.entity';
import { Order } from './order.entity';
import { IngredientCategory } from './ingredient-category.entity';
import { AddOn } from './add-on.entity';
import { Ingredient } from './ingredient.entity';
import { IngredientUpdate } from './ingredient-update.entity';
import { OrderItemAddOn } from './order-item-add-on.entity';
import { OrderItem } from './order-item.entity';
import { SizeGroup } from './size-group.entity';
import { Size } from './size.entity';
import { SweetnessGroup } from './sweetness-group.entity';
import { SweetnessLevel } from './sweetness-level.entity';
import { MenuType } from './menu-type.entity';
import { MenuTypeGroup } from './menu-type-group.entity';
import { LocalData } from './local-data.entity';
import { SyncStatus } from './sync-status.entity';

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

  @Column({ type: 'timestamp', nullable: true })
  otp_expiry: Date;

  @Column('text', { array: true, default: () => "ARRAY['owner']" })
  roles: string[];

  @OneToMany(() => Owner, (employee) => employee.manager, { cascade: true })
  employees: Owner[];

  @ManyToOne(() => Owner, (owner) => owner.employees, { nullable: true })
  manager: Owner;

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

  @OneToMany(() => Payment, (payment) => payment.owner, { cascade: true })
  payment: Payment[];

  @OneToMany(() => Order, (order) => order.owner, { cascade: true })
  order: Order[];

  @OneToMany(
    () => IngredientCategory,
    (ingredientCategory) => ingredientCategory.owner,
    { cascade: true },
  )
  ingredientCategory: IngredientCategory[];

  @OneToMany(() => AddOn, (addOn) => addOn.owner, { cascade: true })
  addOn: AddOn[];

  @OneToMany(() => Ingredient, (ingredient) => ingredient.owner, {
    cascade: true,
  })
  ingredient: Ingredient[];

  @OneToMany(
    () => IngredientUpdate,
    (ingredientUpdate) => ingredientUpdate.owner,
    {
      cascade: true,
    },
  )
  ingredientUpdate: IngredientUpdate[];

  @OneToMany(() => OrderItemAddOn, (orderItemAddOn) => orderItemAddOn.owner, {
    cascade: true,
  })
  orderItemAddOn: OrderItemAddOn[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.owner, {
    cascade: true,
  })
  orderItem: OrderItem[];

  @OneToMany(() => SizeGroup, (sizeGroup) => sizeGroup.owner, {
    cascade: true,
  })
  sizeGroup: SizeGroup[];

  @OneToMany(() => Size, (size) => size.owner, {
    cascade: true,
  })
  size: Size[];

  @OneToMany(() => SweetnessGroup, (sweetnessGroup) => sweetnessGroup.owner, {
    cascade: true,
  })
  sweetnessGroup: SweetnessGroup[];

  @OneToMany(() => SweetnessLevel, (sweetnessLevel) => sweetnessLevel.owner, {
    cascade: true,
  })
  sweetnessLevel: SweetnessLevel[];

  @OneToMany(() => MenuType, (menuType) => menuType.owner, {
    cascade: true,
  })
  menuType: MenuType[];

  @OneToMany(() => MenuTypeGroup, (menuTypeGroup) => menuTypeGroup.owner, {
    cascade: true,
  })
  menuTypeGroup: MenuTypeGroup[];

  @OneToMany(() => LocalData, (localData) => localData.owner, {
    cascade: true,
  })
  localData: LocalData[];

  @OneToMany(() => SyncStatus, (syncStatus) => syncStatus.owner, {
    cascade: true,
  })
  syncStatus: SyncStatus[];
}
