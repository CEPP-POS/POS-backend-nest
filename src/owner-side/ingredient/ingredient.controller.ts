import { Controller, Get, Param } from '@nestjs/common';
import { IngredientService } from './ingredient.service';

@Controller('owner/ingredient')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  async test() {
    return { msg: 'Hi' };
  }

  @Get('/:id')
  async findIngredientById(@Param('id') menuId: number) {
    return this.ingredientService.findIngredientById(menuId);
  }

  @Get('/menu/:id')
  async findAllMenuIngredientById(@Param('id') menuId: number) {
    return this.ingredientService.findAllMenuIngredientById(menuId);
  }
  @Get('/:owner_id')
  async findIngredientsByOwnerId(@Param('owner_id') owner_id: number) {
    return this.ingredientService.findIngredientsByOwnerId(owner_id);
  }
}
