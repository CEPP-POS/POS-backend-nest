import { Controller, Get, Param } from '@nestjs/common';
import { MenuCustomerService } from './menu-customer.service';

@Controller('customer/menus')
export class MenuCustomerController {
  constructor(private readonly menuCustomerService: MenuCustomerService) { }

  // @Get()
  // async getCustomerMenus() {
  //   return this.menuCustomerService.getCustomerMenus();
  // }

  // edit entity
  // @Get()
  // async getMenusAllCategory() {
  //   return this.menuCustomerService.getMenusAllCategory();
  // }

  @Get(':id')
  async getMenuDetails(@Param('id') id: number) {
    return this.menuCustomerService.getMenuDetails(id);
  }
}
