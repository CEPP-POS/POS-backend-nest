import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Owner } from '../owner-side/owner/entity/owner.entity';
import { Menu } from './menu.entity';
import { Order } from './order.entity';
import { SalesSummary } from './sales-summary.entity';
import { Ingredient } from './ingredient.entity';
import { SyncStatus } from './sync-status.entity';

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
}
