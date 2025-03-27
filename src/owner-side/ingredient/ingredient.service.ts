import {
  HttpStatus,
  Injectable,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
// import { Category } from '../../entities/category.entity';
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
    private readonly menuIngredientRepository: Repository<MenuIngredient>,
  ) {}

  async test(): Promise<Ingredient[]> {
    return this.ingredientRepository.find();
  }

  // EDIT ENTITY INGREDIENT MENU LINK
  async findIngredientById(menuId: string) {
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

    return {
      status: HttpStatus.OK,
      message: `Ingredients found for menu with ID ${menuId}`,
    };
  }

  async findIngredientsByOwnerId(
    ownerId: string,
    branchId: string,
  ): Promise<{ ingredient_id: string; ingredient_name: string }[]> {
    try {
      const ingredients = await this.ingredientRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
          is_delete: false,
        },
      });

      return ingredients.map((ingredient) => ({
        ingredient_id: ingredient.ingredient_id,
        ingredient_name: ingredient.ingredient_name,
        unit: ingredient.unit,
      }));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to find ingredients',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAllMenuIngredientById(menuId: string) {
    const menuIngredients = await this.menuIngredientRepository.find({
      where: { menu: Equal(menuId) },
      relations: [
        'menu_id',
        'ingredient_id',
        'size_id',
        'sweetness_id',
        'menu_type_id',
        'add_on',
      ],
    });

    console.log('menuIngredients', menuIngredients);

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
      menuIngredients: menuIngredients.map((menuIngredient) => ({
        menu_ingredient_id: menuIngredient.menu_ingredient_id,
        menu: menuIngredient.menu
          ? {
              menu_id: menuIngredient.menu.menu_id,
              menu_name: menuIngredient.menu.menu_name,
            }
          : null,
        ingredient: menuIngredient.ingredient
          ? {
              ingredient_id: menuIngredient.ingredient.ingredient_id,
              ingredient_name: menuIngredient.ingredient.ingredient_name,
            }
          : null,
        // size: menuIngredient.size_id ? {
        //     size_id: menuIngredient.size_id.size_id,
        //     size_name: menuIngredient.size_id.size_name,
        // } : null,
        //     sweetness: menuIngredient.sweetness_id ? {
        //     sweetness_id: menuIngredient.sweetness_id.sweetness_id,
        //     sweetness_level: menuIngredient.sweetness_id.level_name,
        // } : null,
        menu_type: menuIngredient.menu_type
          ? {
              menu_type_id: menuIngredient.menu_type.menu_type_id,
              menu_type_name: menuIngredient.menu_type.type_name,
            }
          : null,
        // add_on: menuIngredient.add_on ? {
        //     add_on_id: menuIngredient.add_on.add_on_id,
        //     add_on_name: menuIngredient.add_on.add_on_name,
        // } : null,
        quantity_used: menuIngredient.quantity_used,
      })),
    };
  }

  // Method to mark an ingredient as deleted
  async deleteIngredient(ingredient_id: string): Promise<{ message: string }> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { ingredient_id },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingredient with ID ${ingredient_id} not found`,
      );
    }

    // Set is_delete to true
    ingredient.is_delete = true;

    await this.ingredientRepository.save(ingredient);

    return {
      message: `Ingredient with ID ${ingredient_id} has been marked as deleted`,
    };
  }
}
