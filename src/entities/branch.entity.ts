import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Owner } from './owner.entity';
import { Menu } from './menu.entity';
import { Order } from './order.entity';
import { SalesSummary } from './sales-summary.entity';
import { Ingredient } from './ingredient.entity';
import { SyncStatus } from './sync-status.entity';
import { MenuCategory } from './menu_category';
import { Payment } from './payment.entity';
import { IngredientCategory } from './ingredient-category.entity';
import { MenuIngredient } from './menu-ingredient.entity';
import { AddOn } from './add-on.entity';
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

@Entity()
export class Branch {
  @PrimaryGeneratedColumn()
  branch_id: number;

  @Column()
  branch_name: string;

  @Column()
  branch_address: string;

  @Column()
  branch_phone_number: string;

  @ManyToOne(() => Owner, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(() => Order, (order) => order.branch, { cascade: true })
  order: Order[];

  @OneToMany(() => SalesSummary, (salesSumary) => salesSumary.branch, {
    cascade: true,
  })
  salesSummary: SalesSummary[];

  @OneToMany(() => Menu, (menu) => menu.branch, {
    cascade: true,
  })
  menu: Menu[];

  @OneToMany(() => Ingredient, (ingredient) => ingredient.branch, {
    cascade: true,
  })
  ingredient: Ingredient[];

  @OneToMany(() => SyncStatus, (syncStatus) => syncStatus.branch, {
    cascade: true,
  })
  syncStatus: SyncStatus[];

  @OneToMany(() => MenuCategory, (menuCategory) => menuCategory.branch, {
    cascade: true,
  })
  menuCategory: MenuCategory[];

  @OneToMany(() => Payment, (payment) => payment.branch, {
    cascade: true,
  })
  payment: Payment[];

  @OneToMany(
    () => IngredientCategory,
    (ingredientCategory) => ingredientCategory.branch,
    {
      cascade: true,
    },
  )
  ingredientCategory: IngredientCategory[];

  @OneToMany(() => MenuIngredient, (menuIngredient) => menuIngredient.branch, {
    cascade: true,
  })
  menuIngredient: MenuIngredient[];

  @OneToMany(() => AddOn, (addOn) => addOn.branch, {
    cascade: true,
  })
  addOn: AddOn[];

  @OneToMany(
    () => IngredientUpdate,
    (ingredientUpdate) => ingredientUpdate.branch,
    {
      cascade: true,
    },
  )
  ingredientUpdate: IngredientUpdate[];

  @OneToMany(() => OrderItemAddOn, (orderItemAddOn) => orderItemAddOn.branch, {
    cascade: true,
  })
  orderItemAddOn: OrderItemAddOn[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.branch, {
    cascade: true,
  })
  orderItem: OrderItem[];

  @OneToMany(() => SizeGroup, (sizeGroup) => sizeGroup.branch, {
    cascade: true,
  })
  sizeGroup: SizeGroup[];

  @OneToMany(() => Size, (size) => size.branch, {
    cascade: true,
  })
  size: Size[];

  @OneToMany(() => SweetnessGroup, (sweetnessGroup) => sweetnessGroup.branch, {
    cascade: true,
  })
  sweetnessGroup: SweetnessGroup[];

  @OneToMany(() => SweetnessLevel, (sweetnessLevel) => sweetnessLevel.branch, {
    cascade: true,
  })
  sweetnessLevel: SweetnessLevel[];

  @OneToMany(() => MenuType, (menuType) => menuType.branch, {
    cascade: true,
  })
  menuType: MenuType[];

  @OneToMany(() => MenuTypeGroup, (menuTypeGroup) => menuTypeGroup.branch, {
    cascade: true,
  })
  menuTypeGroup: MenuTypeGroup[];

  @OneToMany(() => LocalData, (localData) => localData.branch, {
    cascade: true,
  })
  localData: LocalData[];
}
