import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category/create-category.dto';
// import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';
import { Menu } from '../../entities/menu.entity';
// import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) { }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { category_id: id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { category_name, menu_id } = createCategoryDto;

    // ✅ ตรวจสอบว่ามีหมวดหมู่ที่ชื่อซ้ำกันหรือไม่
    let existingCategory = await this.categoryRepository.findOne({
      where: { category_name },
      relations: ['menu'],
    });

    // ✅ ถ้ายังไม่มีหมวดหมู่นี้ ให้สร้างใหม่
    if (!existingCategory) {
      existingCategory = this.categoryRepository.create({ category_name });
      existingCategory = await this.categoryRepository.save(existingCategory);
    }

    const menus = await this.menuRepository.find({
      where: { menu_id: In(menu_id) },
      relations: ['categories'], // ✅ โหลดหมวดหมู่ที่เกี่ยวข้อง
    });

    // const menus = await this.menuRepository.find({
    //   where: { menu_id: In(menu_id) },
    // });

    if (menus.length !== menu_id.length) {
      throw new NotFoundException(`Some menus with IDs ${menu_id} not found`);
    }

    // const updatedMenus = [...new Set([...existingCategory.menu, ...menus])];

    // edit entity
    // menus.forEach((menu) => {
    //   menu.categories = [...(menu.categories ?? []), existingCategory]; // ✅ ใช้ `?? []` กัน `undefined`
    // });
    // console.log(category_name);
    // await this.menuRepository.save(menus);

    return existingCategory;
  }

  // async linkMenusToCategory(
  //   linkMenuToCategoryDto: LinkMenuToCategoryDto,
  // ): Promise<Category> {
  //   const { category_id, menu_id } = linkMenuToCategoryDto;

  //   const category = await this.categoryRepository.findOne({
  //     where: { category_id },
  //   });
  //   if (!category) {
  //     throw new NotFoundException(`Category with ID ${category_id} not found`);
  //   }

  //   const menus = await this.menuRepository.findByIds(menu_id);
  //   if (menus.length !== menu_id.length) {
  //     throw new NotFoundException(`Some menus with IDs ${menu_id} not found`);
  //   }

  //   menus.forEach((menu) => {
  //     menu.category = category; // กำหนดความสัมพันธ์
  //   });
  //   await this.menuRepository.save(menus); // บันทึกการเปลี่ยนแปลง

  //   return category;
  // }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  // edit entity
  // async getMenusByCategory(categoryId: number): Promise<Menu[]> {
  //   const category = await this.categoryRepository.findOne({
  //     where: { category_id: categoryId },
  //     relations: ['menu'], // โหลดเมนูที่สัมพันธ์กับหมวดหมู่
  //   });

  //   if (!category) {
  //     throw new NotFoundException(`Category with ID ${categoryId} not found`);
  //   }

  //   //return category.menu; // คืนค่ารายการเมนูในหมวดหมู่
  // }

  async updateCategory(
    categoryId: number,
    updateCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const { category_name, menu_id } = updateCategoryDto;

    // ✅ ค้นหา Category ที่ต้องการอัปเดต
    const category = await this.categoryRepository.findOne({
      where: { category_id: categoryId },
      relations: ['menu'], // ✅ โหลดเมนูที่เกี่ยวข้อง
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // ✅ อัปเดตชื่อหมวดหมู่ถ้ามีการส่ง `category_name` มา
    if (category_name) {
      category.category_name = category_name;
    }

    if (menu_id && menu_id.length > 0) {
      // ✅ ค้นหาเมนูที่ต้องการเพิ่มเข้าไปในหมวดหมู่นี้
      const menus = await this.menuRepository.find({
        where: { menu_id: In(menu_id) },
        relations: ['categories'], // ✅ โหลดหมวดหมู่ที่เกี่ยวข้องกับเมนู
      });

      if (menus.length !== menu_id.length) {
        throw new NotFoundException(`Some menus with IDs ${menu_id} not found`);
      }

      // ✅ อัปเดตหมวดหมู่ของเมนู (ไม่ลบทิ้ง แต่เพิ่มเข้าไป)

      // edit entity
      // menus.forEach((menu) => {
      //   menu.categories = [...(menu.categories ?? []), category];
      // });

      // await this.menuRepository.save(menus);
    }

    // ✅ บันทึกการอัปเดต
    await this.categoryRepository.save(category);

    return category;
  }
}
