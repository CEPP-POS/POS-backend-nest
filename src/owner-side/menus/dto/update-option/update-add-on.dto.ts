import { IsNotEmpty, IsString, IsNumber, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AddOnOptionDto {
    @IsString()
    add_on_id: string; // "null" means new add-on

    @IsNotEmpty()
    add_on_name: string;

    @IsString()
    price: string;

    @IsNumber()
    quantity: number;

    @IsString()
    unit: string;
}

export class UpdateAddOnDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddOnOptionDto)
    options: AddOnOptionDto[];

    @IsArray()
    @IsNumber({}, { each: true })
    menu_id: number[];

    @IsBoolean()
    is_require: boolean;

    @IsBoolean()
    is_multiple: boolean;
} 