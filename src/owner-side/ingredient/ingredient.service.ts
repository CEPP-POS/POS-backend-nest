import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { Menu } from '../../entities/menu.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';

@Injectable()
export class IngredientService {
    constructor(
        @InjectRepository(Ingredient)
        private readonly ingredientRepository: Repository<Ingredient>,

        @InjectRepository(IngredientCategory)
        private readonly ingredientCategoryRepository: Repository<IngredientCategory>,
    ) { }

    async test(): Promise<Ingredient[]> {
        return this.ingredientRepository.find();
    }

    async testja(): Promise<IngredientCategory[]> {
        return this.ingredientCategoryRepository.find();
    }
}
