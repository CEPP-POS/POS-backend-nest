import { Get, Injectable, NotFoundException, Param } from '@nestjs/common';
import { MenuDTO } from './dto/menu.dto';
import { Menu } from 'src/entities/menu.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MenusService {
    private menus = [
        {
          menu_id: 17,
          menu_name: "ชาเขียว",
          price: 69,
          description: "ชาเขียวจากญี่ปุ่น",
          image_url: "https://www.starbucks.co.th/stb-media/2020/08/81.Iced-Green-Tea-Latte1080.png",
          type_name: [
            { name: "ร้อน", price_addition: 0 },
            { name: "เย็น", price_addition: 5 },
            { name: "ปั่น", price_addition: 10 }
          ],
          level_name: ["0%", "25%", "50%", "75%"],
          size_name: [
            { name: "s", price_addition: 0 },
            { name: "m", price_addition: 10 },
            { name: "l", price_addition: 15 }
          ],
          add_on_name: [
            { name: "ไข่มุก", price_addition: 10 },
            { name: "วุ้นมะพร้าว", price_addition: 15 },
            { name: "มุก", price_addition: 10 }
          ]
        },
        {
          menu_id: 2,
          menu_name: "โกโก้เย็น",
          price: 79,
          description: "โกโก้หอมหวานเย็นๆ",
          image_url: "https://www.starbucks.co.th/stb-media/2020/08/82.Iced-Cocoa-Drink1080.png",
          type_name: [
            { name: "ร้อน", price_addition: 0 },
            { name: "เย็น", price_addition: 5 },
            { name: "ปั่น", price_addition: 10 }
          ],
          level_name: ["0%", "25%", "50%", "75%"],
          size_name: [
            { name: "s", price_addition: 0 },
            { name: "m", price_addition: 10 },
            { name: "l", price_addition: 15 }
          ],
          add_on_name: [
            { name: "ไข่มุก", price_addition: 10 },
            { name: "วุ้นมะพร้าว", price_addition: 15 },
            { name: "มุก", price_addition: 10 }
          ]
        }
      ];
    
      async getMenu(menu_id : number): Promise<MenuDTO>{
        const menu = this.menus.find(menu => menu.menu_id === menu_id);
        return menu ? menu : null;
      }

    }
