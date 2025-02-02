import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PauseService } from './pause.service';
import { PauseIngredientDto } from './dto/pause-ingredient.dto';
import { PauseMenuDto } from './dto/pause-menu.dto';


@Controller('employee/pause')
export class PauseController {
  constructor(private readonly pauseService: PauseService) { }


  @Get('ingredients')
  async getAllIngredients() {
    return this.pauseService.getAllIngredient();
  }

  @Patch('ingredients')
  async updateIngredients(@Body() ingredientUpdates: { ingredient_id: number; paused: boolean }[]) {
    return this.pauseService.updateIngredient(ingredientUpdates);
  }


  // @Get('menu')
  // async getMenu(): Promise<PauseMenuDto[]> {
  //   return this.pauseService.getMenu();
  // }

  @Get('menus')
  async getAllMenu() {
    return this.pauseService.getAllMenu();
  }

  @Patch('menus')
  async updateMenu(@Body() MenuUpdates: { menu_id: number; paused: boolean }[]) {
    return this.pauseService.updateMenu(MenuUpdates);
  }

}



