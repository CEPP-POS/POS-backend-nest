import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ingredient } from 'src/entities/ingredient.entity';
import { Menu } from 'src/entities/menu.entity';
import { Repository, Between, In } from 'typeorm';

@Injectable()
export class PauseService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) { }

  async getAllIngredient() {
    const ingredients = await this.ingredientRepository.find({
      select: ['ingredient_id', 'ingredient_name', 'paused'],
    });

    return ingredients;
  };

  async updateIngredient(listIngredientUpdates: { ingredient_id: number; paused: boolean }[]) {
    const listIngredientId = listIngredientUpdates.map((item) => item.ingredient_id);

    const ingredients = await this.ingredientRepository.find({
      where: { ingredient_id: In(listIngredientId) },
    });

    ingredients.forEach((ingredient) => {
      const updatePauseStatus = listIngredientUpdates.find((item) => item.ingredient_id === ingredient.ingredient_id);
      if (updatePauseStatus) {
        ingredient.paused = updatePauseStatus.paused;
      }
    });

    await this.ingredientRepository.save(ingredients);

    return { message: "Paused ingredients successfully" };
  }

  async getAllMenu() {
    const menus = await this.menuRepository.find({
      select: ['menu_id', 'menu_name', 'paused'],
    });

    return menus;
  };

  async updateMenu(listMenuUpdates: { menu_id: number; paused: boolean }[]) {
    const listMenuId = listMenuUpdates.map((item) => item.menu_id);

    const menus = await this.menuRepository.find({
      where: { menu_id: In(listMenuId) },
    });

    menus.forEach((menu) => {
      const updatePauseStatus = listMenuUpdates.find((item) => item.menu_id === menu.menu_id);
      if (updatePauseStatus) {
        menu.paused = updatePauseStatus.paused;
      }
    });

    await this.menuRepository.save(menus);

    return { message: "Paused menus successfully" };
  }
}

