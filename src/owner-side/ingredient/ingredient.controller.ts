import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { MenuService } from '../menus/menu.service';

@Controller('owner/ingredient')
export class IngredientController {
    constructor(
        private readonly ingredientService: IngredientService,
    ) { }

    @Get()
    async test() {
        return { "msg": "Hi" }
    }

    @Get('/:id')
    async findIngredientById(@Param('id') menuId: number) {
        return this.ingredientService.findIngredientById(menuId);
    }
}
