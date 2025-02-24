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
  constructor(private readonly menuCustomerService: MenuCustomerService) {}

  @Get()
  async getCustomerMenus(
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
  ) {
    // ตรวจสอบและแปลงค่า
    const ownerIdNum = parseInt(ownerId);
    const branchIdNum = parseInt(branchId);

    if (isNaN(ownerIdNum) || isNaN(branchIdNum)) {
      throw new BadRequestException('Invalid owner_id or branch_id format');
    }

    return this.menuCustomerService.getCustomerMenus(ownerIdNum, branchIdNum);
  }

  @Get(':id')
  async getMenuDetails(
    @Param('id') id: string,
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
  ) {
    // ตรวจสอบและแปลงค่าให้ถูกต้อง
    const menuId = parseInt(id);
    const ownerIdNum = parseInt(ownerId);
    const branchIdNum = parseInt(branchId);

    // ตรวจสอบว่าค่าที่แปลงแล้วถูกต้อง
    if (isNaN(menuId) || isNaN(ownerIdNum) || isNaN(branchIdNum)) {
      throw new BadRequestException('Invalid ID format');
    }

    return this.menuCustomerService.getMenuDetails(
      menuId,
      ownerIdNum,
      branchIdNum,
    );
  }
}
