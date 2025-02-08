import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { Menu } from '../../entities/menu.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';
import { IngredientMenuLink } from 'src/entities/ingredient-menu-link.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';

@Injectable()
export class IngredientService {
    constructor(
        @InjectRepository(Menu)
        private readonly menuRepository: Repository<Menu>,

        @InjectRepository(Ingredient)
        private readonly ingredientRepository: Repository<Ingredient>,

        @InjectRepository(IngredientCategory)
        private readonly ingredientCategoryRepository: Repository<IngredientCategory>,

        @InjectRepository(IngredientMenuLink)
        private readonly ingredientMenuLinkRepository: Repository<IngredientMenuLink>,

        @InjectRepository(MenuIngredient)
        private readonly menuIngredientRepository: Repository<MenuIngredient>
    ) { }

    async test(): Promise<Ingredient[]> {
        return this.ingredientRepository.find();
    }

    async findIngredientById(menuId: number) {
        const menu = await this.menuRepository.findOne({
            where: { menu_id: menuId },
        });

        if (!menu) {
            return {
                status: HttpStatus.NOT_FOUND,
                message: `Menu with ID ${menuId} not found`,
                ingredients: [],
            };
        }

        const ingredientLinks = await this.ingredientMenuLinkRepository.find({
            where: { menu_id: menuId } as FindOptionsWhere<IngredientMenuLink>,
            relations: ['ingredient_id'],
        });

        if (ingredientLinks.length === 0) {
            return {
                status: HttpStatus.NO_CONTENT,
                message: `No ingredients linked to menu with ID ${menuId}`,
                ingredients: [],
            };
        }
        const ingredientIds = ingredientLinks.map(link => link.ingredient_id.ingredient_id);

        const ingredients = await this.ingredientRepository.findByIds(ingredientIds);

        return {
            status: HttpStatus.OK,
            message: `Ingredients found for menu with ID ${menuId}`,
            ingredients: ingredients.map(ingredient => ({
                ingredient_id: ingredient.ingredient_id,
                ingredient_name: ingredient.ingredient_name,
                ingredient_unit: ingredient.unit
            })),
        };
    }
}
