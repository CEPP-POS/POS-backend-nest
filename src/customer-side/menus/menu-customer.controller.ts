import {
  Controller,
  Get,
  Param,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { MenuCustomerService } from './menu-customer.service';

@Controller('customer/menus')
export class MenuCustomerController {
  constructor(private readonly menuCustomerService: MenuCustomerService) { }

  @Get()
  async getCustomerMenus(
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
  ) {
    // ตรวจสอบและแปลงค่า

    if (!ownerId || !branchId) {
      throw new BadRequestException('Invalid owner_id or branch_id format');
    }

    return this.menuCustomerService.getCustomerMenus(ownerId, branchId);
  }

  @Get('queue')
  async getLatestOrder(
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
  ) {
    return this.menuCustomerService.getLatestOrder(ownerId, branchId);
  }

  @Get(':id')
  async getMenuDetails(
    @Param('id') id: string,
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
  ) {
    return this.menuCustomerService.getMenuDetails(id, ownerId, branchId);
  }
}
