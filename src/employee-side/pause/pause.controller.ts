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
async getIngredient(): Promise<PauseIngredientDto[]>{
    return this.pauseService.getIngredient();
    }

  
@Get('menu')
async getMenu(): Promise<PauseMenuDto[]>{
    return this.pauseService.getMenu();
    }
    
    
}



