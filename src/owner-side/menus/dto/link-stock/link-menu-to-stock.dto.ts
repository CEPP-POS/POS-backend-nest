import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsString, ValidateNested } from 'class-validator';

export class IngredientListForStockDto {
    @IsInt()
    size_id: number;

    @IsInt()
    menu_type_id: number;

    @IsInt()
    quantity_used: number;
}

export class LinkMenuToStockDto {
    @IsInt()
    owner_id: number;

    @IsInt()
    branch_id: number;

    @IsString()
    ingredient_name: string;

    @IsString()
    unit: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientListForStockDto)
    ingredientListForStock: IngredientListForStockDto[];
}
