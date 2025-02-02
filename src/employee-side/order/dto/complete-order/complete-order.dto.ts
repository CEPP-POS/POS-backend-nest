import { IsInt, IsString } from 'class-validator';

export class CompleteOrderDto {
    @IsInt()
    order_id: number;

    @IsString()
    status: string;
}