import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category/create-category.dto';
import { Menu } from '../../entities/menu.entity';
import { Owner } from 'src/entities/owner.entity';
import { Branch } from 'src/entities/branch.entity';
import { MenuCategory } from 'src/entities/menu_category';
import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';
// import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

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

  async create(createCategoryDto: CreateCategoryDto): Promise<any> {
    const { owner_id, branch_id, category_name, menu_id } = createCategoryDto;

    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branch_id} not found`);
    }

    let existingCategory = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.menuCategory', 'menuCategory')
      .leftJoinAndSelect('category.owner', 'owner')
      .leftJoinAndSelect('category.branch', 'branch')
      .where('category.category_name = :category_name', { category_name })
      .andWhere('owner.owner_id = :owner_id', { owner_id })
      .andWhere('branch.branch_id = :branch_id', { branch_id })
      .getOne();

    // ✅ ถ้ายังไม่มี Category → ให้สร้างใหม่
    if (!existingCategory) {
      existingCategory = this.categoryRepository.create({
        category_name,
      });

      existingCategory.owner = owner;
      existingCategory.branch = branch;

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

    for (const menu of menus) {
      if (!menu.menuCategory) {
        menu.menuCategory = [];
      }

      const isAlreadyLinked = menu.menuCategory.some(
        (cat) => cat.category.category_id === existingCategory.category_id,
      );

      if (!isAlreadyLinked) {
        const newMenuCategory = new MenuCategory();
        newMenuCategory.menu = menu;
        newMenuCategory.category = existingCategory;

        menu.menuCategory = [...menu.menuCategory, newMenuCategory];
      }
    }

    await this.menuRepository.save(menus);

    return {
      message: 'Category created successfully',
      category: {
        category_id: existingCategory.category_id,
        category_name: existingCategory.category_name,
      },
    };
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
