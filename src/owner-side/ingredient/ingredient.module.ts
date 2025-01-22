import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientService } from './ingredient.service';
import { IngredientController } from './ingredient.controller';
import { IngredientCategory } from 'src/entities/ingredient-category.entity';
import { Payment } from 'src/entities/payment.entity';
import { OcrStatus } from 'src/entities/ocr-status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ingredient,
      IngredientCategory,
      Payment,
      OcrStatus,
    ]),
  ],
  controllers: [IngredientController],
  providers: [IngredientService],
  exports: [IngredientService, TypeOrmModule],
})
export class IngredientModule {}
