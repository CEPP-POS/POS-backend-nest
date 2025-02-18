import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { MenuType } from './menu-type.entity';

@Entity()
export class MenuTypeGroup {
    @PrimaryGeneratedColumn()
    menu_type_group_id: number;

    @Column()
    menu_type_group_name: string;

    @ManyToOne(() => MenuType, { nullable: false })
    @JoinColumn({ name: 'menu_type_id' })
    menuType: MenuType;
}
