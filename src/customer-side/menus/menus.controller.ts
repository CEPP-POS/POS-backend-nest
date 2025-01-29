import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenuDTO } from './dto/menu.dto';


@Controller('customer/menus') 
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get(':menu_id')
  async getMenu(@Param('menu_id') menu_id: number): Promise<MenuDTO>{
    // Call the service to get the menu by ID
    const menu = await this.menusService.getMenu(Number(menu_id));
    
    // Return the menu, or handle case if menu is not found
    if (!menu) {
        throw new NotFoundException(`Menu with id ${menu_id} not found`);
      }
      
      return menu;
    }
}
