import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import axios from 'axios';
import { Branch } from '../../entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch/update-branch.dto';
import { Owner } from '../../entities/owner.entity';
import { Size } from '../../entities/size.entity';
import { SizeGroup } from '../../entities/size-group.entity';
import { SweetnessLevel } from '../../entities/sweetness-level.entity';
import { SweetnessGroup } from '../../entities/sweetness-group.entity';
import { MenuType } from '../../entities/menu-type.entity';
import { MenuTypeGroup } from '../../entities/menu-type-group.entity';
import { IngredientCategory } from '../../entities/ingredient-category.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { AddOn } from '../../entities/add-on.entity';
import { Category } from '../../entities/category.entity';
import { Menu } from '../../entities/menu.entity';
import { MenuCategory } from 'src/entities/menu_category';
import { MenuIngredient } from '../../entities/menu-ingredient.entity';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,

    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,

    @InjectRepository(SizeGroup)
    private readonly sizeGroupRepository: Repository<SizeGroup>,

    @InjectRepository(SweetnessLevel)
    private readonly sweetnessLevelRepository: Repository<SweetnessLevel>,

    @InjectRepository(SweetnessGroup)
    private readonly sweetnessGroupRepository: Repository<SweetnessGroup>,

    @InjectRepository(MenuType)
    private readonly menuTypeRepository: Repository<MenuType>,

    @InjectRepository(MenuTypeGroup)
    private readonly menuTypeGroupRepository: Repository<MenuTypeGroup>,

    @InjectRepository(IngredientCategory)
    private readonly ingredientCategoryRepository: Repository<IngredientCategory>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,

    @InjectRepository(AddOn)
    private readonly addOnRepository: Repository<AddOn>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,

    @InjectRepository(MenuIngredient)
    private readonly menuIngredientRepository: Repository<MenuIngredient>,
  ) {}
  // * Create Branch (Owner Only)
  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const { owner_id, ...branchData } = createBranchDto;

    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    const newBranch = this.branchRepository.create({
      ...branchData,
      owner,
    });

    return this.branchRepository.save(newBranch);
  }
  // * Find All Branches (Owner Only
  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find();
  }
  // * Find One Branch (Owner Only)
  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { branch_id: id },
      relations: ['owner'],
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return branch;
  }
  // * Update Branch (Owner Only)
  async update(
    id: string,
    updateBranchDto: UpdateBranchDto,
    owner_id: string,
  ): Promise<Branch> {
    const branch = await this.findOne(id);
    if (branch.owner.owner_id !== owner_id) {
      throw new ForbiddenException(
        'You do not have permission to update this branch',
      );
    }
    Object.assign(branch, updateBranchDto);
    return this.branchRepository.save(branch);
  }
  // * Remove Branch (Owner Only)
  async remove(id: string, owner_id: string): Promise<void> {
    const branch = await this.findOne(id);
    if (branch.owner.owner_id !== owner_id) {
      throw new ForbiddenException(
        'You do not have permission to delete this branch',
      );
    }
    await this.branchRepository.remove(branch);
  }

  async findOwnerBranches(ownerId: string, branchId: string) {
    if (ownerId == null || branchId == null) {
      throw new BadRequestException('Invalid owner_id or branch_id');
    }

    const currentBranch = await this.branchRepository.findOne({
      where: {
        owner: { owner_id: ownerId },
        branch_id: branchId,
      },
      select: ['branch_id', 'branch_name'],
    });

    if (!currentBranch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    const otherBranches = await this.branchRepository.find({
      where: {
        owner: { owner_id: ownerId },
        branch_id: Not(branchId),
      },
      select: ['branch_id', 'branch_name'],
    });

    return {
      current_branch: currentBranch,
      other_branches: otherBranches,
    };
  }

  async getBranchSetup(ownerId: string, selectedBranchId: string) {
    if (!ownerId || !selectedBranchId) {
      throw new BadRequestException('Invalid owner_id or selected_branch_id');
    }

    const [
      sizes,
      sizeGroups,
      sweetnessLevels,
      sweetnessGroups,
      menuTypes,
      menuTypeGroups,
      ingredientCategories,
      ingredients,
      addOns,
      categories,
      menus,
      menuCategories,
      menuIngredients,
    ] = await Promise.all([
      this.sizeRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          owner: true,
          branch: true,
        },
        select: {
          size_id: true,
          size_name: true,
          size_price: true,
          is_delete: true,
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.sizeGroupRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          size: true,
          owner: true,
          branch: true,
        },
        select: {
          size_group_id: true,
          size_group_name: true,
          size: {
            size_id: true,
          },
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.sweetnessLevelRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          owner: true,
          branch: true,
        },
        select: {
          sweetness_id: true,
          level_name: true,
          is_delete: true,
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.sweetnessGroupRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          sweetnessLevel: true,
          owner: true,
          branch: true,
        },
        select: {
          sweetness_group_id: true,
          sweetness_group_name: true,
          sweetnessLevel: {
            sweetness_id: true,
          },
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.menuTypeRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          owner: true,
          branch: true,
        },
        select: {
          menu_type_id: true,
          type_name: true,
          price_difference: true,
          is_delete: true,
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.menuTypeGroupRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          menuType: true,
          owner: true,
          branch: true,
        },
        select: {
          menu_type_group_id: true,
          menu_type_group_name: true,
          menuType: {
            menu_type_id: true,
          },
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.ingredientCategoryRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          owner: true,
          branch: true,
        },
        select: {
          ingredient_category_id: true,
          ingredient_category_name: true,
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.ingredientRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          ingredientCategory: true,
          owner: true,
          branch: true,
        },
        select: {
          ingredient_id: true,
          ingredient_name: true,
          image_url: true,
          unit: true,
          paused: true,
          is_delete: true,
          ingredientCategory: {
            ingredient_category_id: true,
          },
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.addOnRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          ingredient: true,
          owner: true,
          branch: true,
        },
        select: {
          add_on_id: true,
          is_required: true,
          is_multipled: true,
          add_on_price: true,
          ingredient: {
            ingredient_id: true,
          },
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.categoryRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          owner: true,
          branch: true,
        },
        select: {
          category_id: true,
          category_name: true,
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.menuRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          menuTypeGroup: true,
          sweetnessGroup: true,
          sizeGroup: true,
          owner: true,
          branch: true,
        },
        select: {
          menu_id: true,
          menu_name: true,
          description: true,
          price: true,
          image_url: true,
          paused: true,
          is_delete: true,
          menuTypeGroup: {
            menu_type_group_id: true,
          },
          sweetnessGroup: {
            sweetness_group_id: true,
          },
          sizeGroup: {
            size_group_id: true,
          },
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),

      this.menuCategoryRepository.find({
        where: {
          owner_id: ownerId,
          branch_id: selectedBranchId,
        },
        select: {
          category_id: true,
          menu_id: true,
          owner_id: true,
          branch_id: true,
        },
      }),

      this.menuIngredientRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: {
          menu: true,
          ingredient: true,
          size: true,
          menu_type: true,
          owner: true,
          branch: true,
        },
        select: {
          menu_ingredient_id: true,
          is_addon: true,
          quantity_used: true,
          menu: {
            menu_id: true,
          },
          ingredient: {
            ingredient_id: true,
          },
          size: {
            size_id: true,
          },
          menu_type: {
            menu_type_id: true,
          },
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
        },
      }),
    ]);

    return {
      size: sizes,
      size_group: sizeGroups,
      sweetness_level: sweetnessLevels,
      sweetness_group: sweetnessGroups,
      menu_type: menuTypes,
      menu_type_group: menuTypeGroups,
      ingredient_category: ingredientCategories,
      ingredient: ingredients,
      add_on: addOns,
      category: categories,
      menu: menus,
      menu_category: menuCategories,
      menu_ingredient: menuIngredients,
    };
  }

  async cloneBranchSetup(
    ownerId: string,
    selectedBranchId: string,
    targetBranchId: string,
  ) {
    if (
      ownerId == null ||
      !selectedBranchId == null ||
      targetBranchId == null
    ) {
      throw new BadRequestException(
        'Invalid owner_id, selected_branch_id or target_branch_id',
      );
    }

    try {
      // เรียก GET endpoint จาก server อื่น
      const response = await axios.get(
        `http://192.168.1.185:3000/branches/owner/get-branch-setup/${selectedBranchId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            owner_id: ownerId.toString(),
          },
        },
      );

      const sourceSetup = response.data;
      const owner = await this.ownerRepository.findOne({ where: { owner_id: ownerId } });
      const branch = await this.branchRepository.findOne({ where: { branch_id: targetBranchId } });

      // บันทึกข้อมูล Size
      if (sourceSetup.size && sourceSetup.size.length > 0) {
        const sizes = sourceSetup.size.map(size => ({
          ...size,
          owner,
          branch,
        }));
        await this.sizeRepository.save(sizes);
      }

      // บันทึกข้อมูล SizeGroup
      if (sourceSetup.size_group && sourceSetup.size_group.length > 0) {
        const sizeGroups = sourceSetup.size_group.map(group => ({
          ...group,
          owner,
          branch,
        }));
        await this.sizeGroupRepository.save(sizeGroups);
      }

      // บันทึกข้อมูล SweetnessLevel
      if (sourceSetup.sweetness_level && sourceSetup.sweetness_level.length > 0) {
        const sweetnessLevels = sourceSetup.sweetness_level.map(level => ({
          ...level,
          owner,
          branch,
        }));
        await this.sweetnessLevelRepository.save(sweetnessLevels);
      }

      // บันทึกข้อมูล SweetnessGroup
      if (sourceSetup.sweetness_group && sourceSetup.sweetness_group.length > 0) {
        const sweetnessGroups = sourceSetup.sweetness_group.map(group => ({
          ...group,
          owner,
          branch,
        }));
        await this.sweetnessGroupRepository.save(sweetnessGroups);
      }

      // บันทึกข้อมูล MenuType
      if (sourceSetup.menu_type && sourceSetup.menu_type.length > 0) {
        const menuTypes = sourceSetup.menu_type.map(type => ({
          ...type,
          owner,
          branch,
        }));
        await this.menuTypeRepository.save(menuTypes);
      }

      // บันทึกข้อมูล MenuTypeGroup
      if (sourceSetup.menu_type_group && sourceSetup.menu_type_group.length > 0) {
        const menuTypeGroups = sourceSetup.menu_type_group.map(group => ({
          ...group,
          owner,
          branch,
        }));
        await this.menuTypeGroupRepository.save(menuTypeGroups);
      }

      // บันทึกข้อมูล IngredientCategory
      if (sourceSetup.ingredient_category && sourceSetup.ingredient_category.length > 0) {
        const ingredientCategories = sourceSetup.ingredient_category.map(category => ({
          ...category,
          owner,
          branch,
        }));
        await this.ingredientCategoryRepository.save(ingredientCategories);
      }

      // บันทึกข้อมูล Ingredient
      if (sourceSetup.ingredient && sourceSetup.ingredient.length > 0) {
        const ingredients = sourceSetup.ingredient.map(ingredient => ({
          ...ingredient,
          owner,
          branch,
        }));
        await this.ingredientRepository.save(ingredients);
      }

      // บันทึกข้อมูล AddOn
      if (sourceSetup.add_on && sourceSetup.add_on.length > 0) {
        const addOns = sourceSetup.add_on.map(addon => ({
          ...addon,
          owner,
          branch,
        }));
        await this.addOnRepository.save(addOns);
      }

      // บันทึกข้อมูล Category
      if (sourceSetup.category && sourceSetup.category.length > 0) {
        const categories = sourceSetup.category.map(category => ({
          ...category,
          owner,
          branch,
        }));
        await this.categoryRepository.save(categories);
      }

      // บันทึกข้อมูล Menu
      if (sourceSetup.menu && sourceSetup.menu.length > 0) {
        const menus = sourceSetup.menu.map(menu => ({
          ...menu,
          owner,
          branch,
        }));
        await this.menuRepository.save(menus);
      }

      // บันทึกข้อมูล MenuCategory
      if (sourceSetup.menu_category && sourceSetup.menu_category.length > 0) {
        const menuCategories = sourceSetup.menu_category.map(category => ({
          ...category,
          owner_id: ownerId,
          branch_id: targetBranchId,
        }));
        await this.menuCategoryRepository.save(menuCategories);
      }

      // บันทึกข้อมูล MenuIngredient
      if (sourceSetup.menu_ingredient && sourceSetup.menu_ingredient.length > 0) {
        const menuIngredients = sourceSetup.menu_ingredient.map(ingredient => ({
          ...ingredient,
          owner,
          branch,
        }));
        await this.menuIngredientRepository.save(menuIngredients);
      }

      return {
        message: 'Branch setup cloned successfully',
        source_branch_id: selectedBranchId,
        target_branch_id: targetBranchId,
      };
    } catch (error) {
      console.error('Error cloning branch setup:', error.message);
      throw new BadRequestException(
        'Failed to clone branch setup',
      );
    }
  }
}
