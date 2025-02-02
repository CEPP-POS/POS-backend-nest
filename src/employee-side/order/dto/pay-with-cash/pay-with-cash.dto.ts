import { IsNotEmpty, IsInt, Min, IS_ARRAY } from 'class-validator';
import { Column, CreateDateColumn, JoinColumn, OneToOne } from 'typeorm';
import { Order } from 'src/entities/order.entity';

export class PayWithCashDto {

    @OneToOne(() => Order, { nullable: false })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @CreateDateColumn()
    payment_date: Date;

    @Column({ type: 'varchar', length: 255 })
    payment_method: string;

    @Column()
    amount: number;

    @Column()
    total_amount: number;

    @Column()
    @IsInt()
    cash_given: number;

    @Column()
    @IsInt()
    change: number;

    @Column()
    @IsInt()
    status: string;
}
