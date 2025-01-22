import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { SyncStatus } from './sync-status.entity';

export enum OperationType {
    INSERT = 'Insert',
    UPDATE = 'Update',
    DELETE = 'Delete',
}

export enum Status {
    'pending', 'synced'
}

@Entity()
export class LocalData {
    @PrimaryGeneratedColumn()
    local_data_id: number;

    @Column()
    table_name: string;

    @Column()
    order_id: number;

    @Column({
        type: 'enum',
        enum: OperationType,
        default: OperationType.INSERT,
        nullable: false,
    })
    operation_type: OperationType;

    @Column({
        type: 'json',
        nullable: true,
    })
    data: any;

    @ManyToOne(() => SyncStatus, { nullable: false })
    @JoinColumn({ name: 'sync_status_id' })
    sync_status_id: SyncStatus;

    @Column({
        type: 'enum',
        enum: Status,
        default: Status.pending,
        nullable: true,
    })
    status: Status;

    @CreateDateColumn()
    created_at: Date;
}

