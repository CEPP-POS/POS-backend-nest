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
import { Owner } from 'src/owner-side/owner/entity/owner.entity';
import { Branch } from 'src/entities/branch.entity';
import { MenuCategory } from 'src/entities/menu_category';
import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';
import { Owner } from '../owner/entity/owner.entity';
// import { LinkMenuToCategoryDto } from './dto/link-menu-to-category/link-menu-to-category.dto';

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

    // ✅ Validate Owner
    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner)
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);

    // ✅ Validate Branch
    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });
    if (!branch)
      throw new NotFoundException(`Branch with ID ${branch_id} not found`);

    // ✅ Check for duplicate category
    const duplicateCategory = await this.categoryRepository.findOne({
      where: { category_name },
    });
    if (duplicateCategory)
      throw new ConflictException(
        `Category with name "${category_name}" already exists`,
      );

    // ✅ Retrieve or create category
    let category = await this.categoryRepository.findOne({
      where: { category_name, owner: { owner_id }, branch: { branch_id } },
      relations: ['owner', 'branch', 'menuCategory'],
    });

    if (!category) {
      category = this.categoryRepository.create({
        category_name,
        owner,
        branch,
      });
      category = await this.categoryRepository.save(category);
    }

    // ✅ Validate Menus
    const menus = await this.menuRepository.find({
      where: { menu_id: In(menu_id) },
      relations: ['menuCategory'],
    });
    console.log('Menus:', menus);
    if (menus.length !== menu_id.length) {
      throw new NotFoundException(`Some menus with IDs ${menu_id} not found`);
    }

    // ✅ Associate Menus with Category
    for (const menu of menus) {
      const existingMenuCategory = await this.menuCategoryRepository.findOne({
        where: { category: { category_id: category.category_id }, menu },
      });

      if (!existingMenuCategory) {
        const newMenuCategory = this.menuCategoryRepository.create({
          category,
          menu,
          owner_id,
          branch_id,
        });
        await this.menuCategoryRepository.save(newMenuCategory);
      }
    }

    return {
      message: 'Category created successfully',
      category: {
        category_id: category.category_id,
        category_name: category.category_name,
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

  async remove(id: number, owner_id: number, branch_id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: {
        category_id: id,
        owner: { owner_id },
        branch: { branch_id },
      },
      relations: ['owner', 'branch'],
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${id} not found or does not belong to the specified owner/branch`,
      );
    }

    await this.categoryRepository.remove(category);
  }

  // edit entity
  async getMenusByCategory(data): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: {
        category_id: data.id,
        owner: { owner_id: data.owner_id },
        branch: { branch_id: data.branch_id },
      },
      relations: ['menuCategory', 'menuCategory.menu'], // Ensure correct relation path
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${data.id} not found`);
    }

    return category.menuCategory.map((mc) => mc.menu.menu_name); // Return menus instead of MenuCategory objects
  }

  async updateCategory(
    categoryId: number,
    owner_id: number,
    branch_id: number,
    updateCategoryDto: CreateCategoryDto,
  ): Promise<any> {
    const { category_name, menu_id } = updateCategoryDto;

    // ✅ Find the Category
    const category = await this.categoryRepository.findOne({
      where: {
        category_id: categoryId,
        owner: { owner_id },
        branch: { branch_id },
      },
      relations: ['owner', 'branch'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // ✅ Validate Owner and Branch
    if (
      !category.owner ||
      Number(category.owner.owner_id) !== Number(owner_id)
    ) {
      throw new ConflictException(
        `Category does not belong to the specified owner`,
      );
    }

    if (
      category.branch &&
      Number(category.branch.branch_id) !== Number(branch_id)
    ) {
      throw new ConflictException(
        `Category does not belong to the specified branch`,
      );
    }

    // ✅ Update Category Name (if changed)
    if (category_name) {
      category.category_name = category_name;
    }

    // ✅ Fetch existing MenuCategory relations for this category
    const existingMenuCategories = await this.menuCategoryRepository.find({
      where: { category_id: categoryId },
    });

    const existingMenuIds = existingMenuCategories.map((mc) => mc.menu_id);
    const newMenuIds = menu_id || [];

    // ✅ Find menus from new menu_id array
    const menus = await this.menuRepository.find({
      where: { menu_id: In(newMenuIds) },
    });

    if (menus.length !== newMenuIds.length) {
      throw new NotFoundException(
        `Some menus with IDs ${newMenuIds} not found`,
      );
    }

    // ✅ Delete menu categories that are NOT in the new menu_id array
    const menusToRemove = existingMenuIds.filter(
      (id) => !newMenuIds.includes(id),
    );

    if (menusToRemove.length > 0) {
      await this.menuCategoryRepository
        .createQueryBuilder()
        .delete()
        .where('category_id = :categoryId', { categoryId })
        .andWhere('menu_id IN (:...menusToRemove)', { menusToRemove })
        .execute();
    }

    // ✅ Insert new menu categories that are NOT in the database
    const menusToAdd = newMenuIds.filter((id) => !existingMenuIds.includes(id));

    if (menusToAdd.length > 0) {
      const newMenuCategories = menusToAdd.map((menu_id) =>
        this.menuCategoryRepository.create({
          category,
          menu: { menu_id },
          owner: { owner_id },
          branch: { branch_id },
        }),
      );

      await this.menuCategoryRepository.save(newMenuCategories);
    }

    // ✅ Save updated category
    await this.categoryRepository.save(category);

    return {
      message: 'Category updated successfully',
      category: {
        category_id: category.category_id,
        category_name: category.category_name,
      },
    };
  }
}
