import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category/create-category.dto';
import { Menu } from '../../entities/menu.entity';
import { MenuCategory } from 'src/entities/menu_category';
import { Owner } from 'src/entities/owner.entity';
import { Branch } from 'src/entities/branch.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,

    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
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

  async create(createCategoryDto: CreateCategoryDto): Promise<any> {
    const { owner_id, branch_id, category_name, menu_id } = createCategoryDto;

    // ✅ ดึง Owner จากฐานข้อมูล
    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    // ✅ ดึง Branch จากฐานข้อมูล
    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branch_id} not found`);
    }

    // ✅ ตรวจสอบว่ามี Category อยู่แล้วหรือไม่
    let existingCategory = await this.categoryRepository.findOne({
      where: { category_name, owner: { owner_id }, branch: { branch_id } },
      relations: ['owner', 'branch', 'menuCategory'],
    });

    // ✅ ถ้ายังไม่มี Category → ให้สร้างใหม่
    if (!existingCategory) {
      existingCategory = this.categoryRepository.create({
        category_name,
        owner,
        branch,
      });

      existingCategory = await this.categoryRepository.save(existingCategory);
    }

    // ✅ ตรวจสอบว่าเมนูที่ส่งมา มีอยู่จริงในฐานข้อมูล
    const menus = await this.menuRepository.find({
      where: { menu_id: In(menu_id) },
      relations: ['menuCategory'],
    });

    if (menus.length !== menu_id.length) {
      throw new NotFoundException(`Some menus with IDs ${menu_id} not found`);
    }

    // ✅ บันทึก MenuCategory ให้สัมพันธ์กับ Category
    for (const menu of menus) {
      const existingMenuCategory = await this.menuCategoryRepository.findOne({
        where: {
          category: { category_id: existingCategory.category_id },
          menu,
        },
      });

      if (!existingMenuCategory) {
        const newMenuCategory = this.menuCategoryRepository.create({
          category: existingCategory,
          menu: [menu],
        });

        await this.menuCategoryRepository.save(newMenuCategory);
      }
    }

    return {
      message: 'Category created successfully',
      category: {
        category_id: existingCategory.category_id,
        category_name: existingCategory.category_name,
      },
    };
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
    owner_id: number,
    branch_id: number,
    updateCategoryDto: CreateCategoryDto,
  ): Promise<any> {
    const { category_name } = updateCategoryDto;

    const category = await this.categoryRepository.findOne({
      where: { category_id: categoryId },
      relations: ['owner', 'branch', 'menuCategory'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    console.log(
      `Category: ${category.category_id}, Owner: ${category.owner.owner_id}, Branch: ${category.branch.branch_id}`,
    );
    console.log(`Request Header -> Owner: ${owner_id}, Branch: ${branch_id}`);

    if (
      category.owner.owner_id !== owner_id ||
      category.branch.branch_id !== branch_id
    ) {
      throw new ConflictException(
        `Category does not belong to the specified owner or branch`,
      );
    }

    if (category_name) {
      category.category_name = category_name;
    }

    await this.categoryRepository.save(category);

    return {
      category_id: category.category_id,
      category_name: category.category_name,
    };
  }
}
