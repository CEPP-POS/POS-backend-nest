import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { IngredientService } from './ingredient.service';

@Controller('owner/ingredient')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) { }

  // @Get()
  // async test() {
  //   return { msg: 'Hi' };
  // }

  @Get('/:id')
  async findIngredientById(@Param('id') menuId: string) {
    return this.ingredientService.findIngredientById(menuId);
  }

  @Get('/menu/:id')
  async findAllMenuIngredientById(@Param('id') menuId: string) {
    return this.ingredientService.findAllMenuIngredientById(menuId);
  }

  @Get()
  async findIngredientsByOwnerId(@Req() request: Request) {
    const ownerId = request.headers['owner-id'];
    const branchId = request.headers['branch-id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }
    return this.ingredientService.findIngredientsByOwnerId(ownerId, branchId);
  }
}
