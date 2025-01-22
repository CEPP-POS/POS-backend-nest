import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { IngredientService } from './ingredient.service';

@Controller('owner/ingredient')
export class IngredientController {
    constructor(private readonly ingredientService: IngredientService) { }

    @Get()
    async test() {
        return { "msg": "Hi" }
    }
}
