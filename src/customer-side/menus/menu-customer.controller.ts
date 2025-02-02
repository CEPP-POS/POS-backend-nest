import { Controller, Get } from '@nestjs/common';
import { MenuCustomerService } from './menu-customer.service';

@Controller('customer/menus')
export class MenuCustomerController {
  constructor(private readonly menuCustomerService: MenuCustomerService) {}

  // @Get()
  // async getCustomerMenus() {
  //   return this.menuCustomerService.getCustomerMenus();
  // }
  @Get()
  async getMenusAllCategory() {
    return this.menuCustomerService.getMenusAllCategory();
  }
}
