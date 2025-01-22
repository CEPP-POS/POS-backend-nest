import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientService } from './ingredient.service';
import { IngredientController } from './ingredient.controller';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ingredient, IngredientCategory])],
    controllers: [IngredientController],
    providers: [IngredientService],
    exports: [IngredientService, TypeOrmModule],
})
export class IngredientModule { }
