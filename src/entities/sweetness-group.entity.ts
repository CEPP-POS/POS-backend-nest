import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { SweetnessLevel } from './sweetness-level.entity';

@Entity()
export class SweetnessGroup {
    @PrimaryGeneratedColumn()
    sweetness_group_id: number;

    @Column()
    sweetness_group_name: string;

    @ManyToOne(() => SweetnessLevel, { nullable: false })
    @JoinColumn({ name: 'sweetness_id' })
    sweetnessLevel: SweetnessLevel;
}
