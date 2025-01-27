import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';



@Injectable()
export class PauseService {
  constructor(
  ) {}

  async getIngredient(){
    const ingredients = [
        {
          ingredient_id: 'asdasdasad',  // String ID
          ingredient_name: 'ไข่มุก',
          paused: false,
        },
        {
          ingredient_id: 'qwertyuiop',  // Another example string ID
          ingredient_name: 'วุ้นมะพร้าว',
          paused: true,
        },
      ];
  
      return ingredients;
    }

    async getMenu(){
        const menus = [
            {
              menu_id: 'ffff',  // String ID for the menu
              menu_name: 'ไข่มุก',
              paused: false,
            },
            {
              menu_id: 'abcd',  // Another example string ID for the menu
              menu_name: 'ชานมไต้หวัน',
              paused: true,
            },
          ];
      
          return menus;
        }
    }

