import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsWhere, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { Menu } from '../../entities/menu.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';
// import { IngredientMenuLink } from 'src/entities/ingredient-menu-link.entity';
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

        // @InjectRepository(IngredientMenuLink)
        // private readonly ingredientMenuLinkRepository: Repository<IngredientMenuLink>,

        @InjectRepository(MenuIngredient)
        private readonly menuIngredientRepository: Repository<MenuIngredient>
    ) { }

    async test(): Promise<Ingredient[]> {
        return this.ingredientRepository.find();
    }

    // EDIT ENTITY INGREDIENT MENU LINK
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

        // const ingredientLinks = await this.ingredientMenuLinkRepository.find({
        //     where: { menu_id: menuId } as FindOptionsWhere<IngredientMenuLink>,
        //     relations: ['ingredient_id'],
        // });

        // if (ingredientLinks.length === 0) {
        //     return {
        //         status: HttpStatus.NO_CONTENT,
        //         message: `No ingredients linked to menu with ID ${menuId}`,
        //         ingredients: [],
        //     };
        // }
        // const ingredientIds = ingredientLinks.map(link => link.ingredient_id.ingredient_id);

        // const ingredients = await this.ingredientRepository.findByIds(ingredientIds);

        return {
            status: HttpStatus.OK,
            message: `Ingredients found for menu with ID ${menuId}`,
            // ingredients: ingredients.map(ingredient => ({
            //     ingredient_id: ingredient.ingredient_id,
            //     ingredient_name: ingredient.ingredient_name,
            //     ingredient_unit: ingredient.unit
            // })),
        };
    }

    async findAllMenuIngredientById(menuId: number) {
        const menuIngredients = await this.menuIngredientRepository.find({
            where: { menu: Equal(menuId) },
            relations: ['menu_id', 'ingredient_id', 'size_id', 'sweetness_id', 'menu_type_id', 'add_on'],
        });

        console.log("menuIngredients", menuIngredients)

        if (menuIngredients.length === 0) {
            return {
                status: HttpStatus.NO_CONTENT,
                message: 'No menu ingredients found',
                menuIngredients: [],
            };
        }

        return {
            status: HttpStatus.OK,
            message: 'Menu ingredients retrieved successfully',
            menuIngredients: menuIngredients.map(menuIngredient => ({
                menu_ingredient_id: menuIngredient.menu_ingredient_id,
                menu: menuIngredient.menu ? {
                    menu_id: menuIngredient.menu.menu_id,
                    menu_name: menuIngredient.menu.menu_name,
                } : null,
                ingredient: menuIngredient.ingredient ? {
                    ingredient_id: menuIngredient.ingredient.ingredient_id,
                    ingredient_name: menuIngredient.ingredient.ingredient_name,
                } : null,
                // size: menuIngredient.size_id ? {
                //     size_id: menuIngredient.size_id.size_id,
                //     size_name: menuIngredient.size_id.size_name,
                // } : null,
                //     sweetness: menuIngredient.sweetness_id ? {
                //     sweetness_id: menuIngredient.sweetness_id.sweetness_id,
                //     sweetness_level: menuIngredient.sweetness_id.level_name,
                // } : null,
                menu_type: menuIngredient.menu_type ? {
                    menu_type_id: menuIngredient.menu_type.menu_type_id,
                    menu_type_name: menuIngredient.menu_type.type_name,
                } : null,
                // add_on: menuIngredient.add_on ? {
                //     add_on_id: menuIngredient.add_on.add_on_id,
                //     add_on_name: menuIngredient.add_on.add_on_name,
                // } : null,
                quantity_used: menuIngredient.quantity_used,
            })),
        };
    }
}
