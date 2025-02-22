import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from "class-validator";
import { Size } from "src/entities/size.entity";

export class CreateSizeDto {
    @IsString()
    size_group_name: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Size)
    options: Size[];

    @IsArray()
    @IsNumber({}, { each: true })
    menu_id: number[];

    @IsBoolean()
    is_required: boolean;
}