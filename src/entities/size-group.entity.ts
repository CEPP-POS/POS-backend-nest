import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Size } from './size.entity';

@Entity()
export class SizeGroup {
    @PrimaryGeneratedColumn()
    size_group_id: number;

    @Column()
    size_group_name: string;

    @ManyToOne(() => Size, { nullable: false })
    @JoinColumn({ name: 'size_id' })
    size: Size;
}
