import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientService } from './ingredient.service';
import { IngredientController } from './ingredient.controller';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';
import { IngredientMenuLink } from 'src/entities/ingredient-menu-link.entity';
import { IngredientUpdate } from 'src/entities/ingredient-update.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';
import { LocalData } from 'src/entities/local-data.entity';
import { SyncStatus } from 'src/entities/sync-status.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Ingredient, IngredientCategory, IngredientMenuLink, IngredientUpdate, MenuIngredient, LocalData, SyncStatus])],
    controllers: [IngredientController],
    providers: [IngredientService],
    exports: [IngredientService, TypeOrmModule],
})
export class IngredientModule { }
