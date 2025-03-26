import { Controller, Get, Body, Patch, Headers } from '@nestjs/common';

import { PauseService } from './pause.service';

@Controller('employee/pause')
export class PauseController {
  constructor(private readonly pauseService: PauseService) {}

  @Get('ingredients')
  async getAllIngredients(
    @Headers('owner_id') owner_id: string,
    @Headers('branch_id') branch_id: string,
  ) {
    return this.pauseService.getAllIngredient(owner_id, branch_id);
  }

  @Patch('ingredients')
  async updateIngredients(
    @Body() ingredientUpdates: { ingredient_id: string; paused: boolean }[],
    @Headers('owner_id') owner_id: string,
    @Headers('branch_id') branch_id: string,
  ) {
    return this.pauseService.updateIngredient(
      ingredientUpdates,
      owner_id,
      branch_id,
    );
  }

  @Get('menus')
  async getAllMenu(
    @Headers('owner_id') owner_id: string,
    @Headers('branch_id') branch_id: string,
  ) {
    return this.pauseService.getAllMenu(owner_id, branch_id);
  }

  @Patch('menus')
  async updateMenu(
    @Body() MenuUpdates: { menu_id: string; paused: boolean }[],
    @Headers('owner_id') owner_id: string,
    @Headers('branch_id') branch_id: string,
  ) {
    return this.pauseService.updateMenu(MenuUpdates, owner_id, branch_id);
  }
}
