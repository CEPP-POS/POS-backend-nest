import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category/create-category.dto';
// import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';
import { Menu } from '../../entities/menu.entity';
import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';
import { MenuCategory } from 'src/entities/menu_category';
// import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,
  ) {}

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

  async linkMenusToCategory(
    linkMenuToCategoryDto: LinkMenuToCategoryDto,
  ): Promise<any> {
    const { owner_id, branch_id, category_id, menu_ids } =
      linkMenuToCategoryDto;

    // Find the category by category_id, owner_id, and branch_id
    const category = await this.categoryRepository.findOne({
      where: { category_id },
    });

    if (!category) {
      throw new HttpException(
        `Category with ID ${category_id} not found for the specified owner and branch`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Find the menus by menu_ids and validate ownership/branch
    const menus = await this.menuRepository.find({
      where: { menu_id: In(menu_ids) },
    });

    if (menus.length !== menu_ids.length) {
      throw new HttpException(
        `Some menus with IDs ${menu_ids} not found for the specified owner and branch`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Step 1: Delete existing MenuCategory entries that are not in the new list
    const deleteResult = await this.menuCategoryRepository
      .createQueryBuilder()
      .delete()
      .where('category_id = :category_id', { category_id })
      .andWhere('owner_id = :owner_id', { owner_id })
      .andWhere('branch_id = :branch_id', { branch_id })
      .andWhere('menu_id NOT IN (:...menu_ids)', { menu_ids })
      .execute();

    // Step 2: Create and save new MenuCategory entries for the given menus
    const menuCategories = menus.map((menu) =>
      this.menuCategoryRepository.create({
        category_id: category.category_id,
        menu_id: menu.menu_id,
        owner_id: owner_id,
        branch_id: branch_id,
      }),
    );

    await this.menuCategoryRepository.save(menuCategories);

    return {
      statusCode: HttpStatus.OK,
      message: 'Menu-category links updated successfully',
      deletedCount: deleteResult.affected || 0,
      addedCount: menuCategories.length,
    };
  }

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
