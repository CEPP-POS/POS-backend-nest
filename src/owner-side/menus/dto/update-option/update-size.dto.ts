import { IsNotEmpty, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SizeOptionDto {
    @IsString()
    size_id: string; // "null" means new size

    @IsNotEmpty()
    size_name: string;

    @IsNumber()
    price: number;
}

export class UpdateSizeDto {
    @IsString()
    old_size_group_name: string;

    @IsString()
    new_size_group_name: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SizeOptionDto)
    options: SizeOptionDto[];

    @IsArray()
    @IsNumber({}, { each: true })
    menu_id: number[];
}
