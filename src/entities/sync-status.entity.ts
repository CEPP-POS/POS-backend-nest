import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn
} from 'typeorm';
import { Branch } from './branch.entity';

export enum syncStatus {
    'online', 'offline'
}

@Entity()
export class SyncStatus {
    @PrimaryGeneratedColumn()
    sync_status_id: number;

    @ManyToOne(() => Branch, { nullable: false })
    @JoinColumn({ name: 'branch_id' })
    branch_id: Branch;

    @CreateDateColumn()
    last_sync: Date;

    @Column({
        type: 'enum',
        enum: syncStatus,
        default: syncStatus.online,
        nullable: true,
    })
    status: syncStatus;
}
