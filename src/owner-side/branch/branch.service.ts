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
  async findOne(id: number): Promise<Branch> {
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
    id: number,
    updateBranchDto: UpdateBranchDto,
    owner_id: number,
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
  async remove(id: number, owner_id: number): Promise<void> {
    const branch = await this.findOne(id);
    if (branch.owner.owner_id !== owner_id) {
      throw new ForbiddenException(
        'You do not have permission to delete this branch',
      );
    }
    await this.branchRepository.remove(branch);
  }

  async findOwnerBranches(ownerId: number, branchId: number) {
    if (isNaN(ownerId) || isNaN(branchId)) {
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

  async getBranchSetup(ownerId: number, selectedBranchId: number) {
    if (isNaN(ownerId) || isNaN(selectedBranchId)) {
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
      this.sizeRepository
        .createQueryBuilder('size')
        .select([
          'size.size_id',
          'size.size_name',
          'size.size_price',
          'size.is_delete',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('size.owner', 'owner')
        .leftJoin('size.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((sizes) =>
          sizes.map((size) => ({
            size_id: size.size_size_id,
            size_name: size.size_size_name,
            size_price: size.size_size_price,
            is_delete: size.size_is_delete,
            owner_id: size.owner_owner_id,
            branch_id: size.branch_branch_id,
          })),
        ),
      this.sizeGroupRepository
        .createQueryBuilder('sizeGroup')
        .select([
          'sizeGroup.size_group_id',
          'sizeGroup.size_group_name',
          'size.size_id',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('sizeGroup.size', 'size')
        .leftJoin('sizeGroup.owner', 'owner')
        .leftJoin('sizeGroup.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((groups) =>
          groups.map((group) => ({
            size_group_id: group.sizeGroup_size_group_id,
            size_group_name: group.sizeGroup_size_group_name,
            size_id: group.size_size_id,
            owner_id: group.owner_owner_id,
            branch_id: group.branch_branch_id,
          })),
        ),
      this.sweetnessLevelRepository
        .createQueryBuilder('sweetnessLevel')
        .select([
          'sweetnessLevel.sweetness_id',
          'sweetnessLevel.level_name',
          'sweetnessLevel.is_delete',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('sweetnessLevel.owner', 'owner')
        .leftJoin('sweetnessLevel.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            sweetness_id: item.sweetnessLevel_sweetness_id,
            level_name: item.sweetnessLevel_level_name,
            is_delete: item.sweetnessLevel_is_delete,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.sweetnessGroupRepository
        .createQueryBuilder('sweetnessGroup')
        .select([
          'sweetnessGroup.sweetness_group_id',
          'sweetnessGroup.sweetness_group_name',
          'sweetnessLevel.sweetness_id',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('sweetnessGroup.sweetnessLevel', 'sweetnessLevel')
        .leftJoin('sweetnessGroup.owner', 'owner')
        .leftJoin('sweetnessGroup.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            sweetness_group_id: item.sweetnessGroup_sweetness_group_id,
            sweetness_group_name: item.sweetnessGroup_sweetness_group_name,
            sweetness_id: item.sweetnessLevel_sweetness_id,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.menuTypeRepository
        .createQueryBuilder('menuType')
        .select([
          'menuType.menu_type_id',
          'menuType.type_name',
          'menuType.price_difference',
          'menuType.is_delete',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('menuType.owner', 'owner')
        .leftJoin('menuType.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            menu_type_id: item.menuType_menu_type_id,
            type_name: item.menuType_type_name,
            price_difference: item.menuType_price_difference,
            is_delete: item.menuType_is_delete,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.menuTypeGroupRepository
        .createQueryBuilder('menuTypeGroup')
        .select([
          'menuTypeGroup.menu_type_group_id',
          'menuTypeGroup.menu_type_group_name',
          'menuType.menu_type_id',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('menuTypeGroup.menuType', 'menuType')
        .leftJoin('menuTypeGroup.owner', 'owner')
        .leftJoin('menuTypeGroup.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            menu_type_group_id: item.menuTypeGroup_menu_type_group_id,
            menu_type_group_name: item.menuTypeGroup_menu_type_group_name,
            menu_type_id: item.menuType_menu_type_id,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.ingredientCategoryRepository
        .createQueryBuilder('ingredientCategory')
        .select([
          'ingredientCategory.ingredient_category_id',
          'ingredientCategory.ingredient_category_name',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('ingredientCategory.owner', 'owner')
        .leftJoin('ingredientCategory.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            ingredient_category_id:
              item.ingredientCategory_ingredient_category_id,
            ingredient_category_name:
              item.ingredientCategory_ingredient_category_name,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.ingredientRepository
        .createQueryBuilder('ingredient')
        .select([
          'ingredient.ingredient_id',
          'ingredient.ingredient_name',
          'ingredient.image_url',
          'ingredient.unit',
          'ingredient.paused',
          'ingredient.is_delete',
          'ingredientCategory.ingredient_category_id',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('ingredient.ingredientCategory', 'ingredientCategory')
        .leftJoin('ingredient.owner', 'owner')
        .leftJoin('ingredient.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            ingredient_id: item.ingredient_ingredient_id,
            ingredient_name: item.ingredient_ingredient_name,
            image_url: item.ingredient_image_url,
            unit: item.ingredient_unit,
            paused: item.ingredient_paused,
            is_delete: item.ingredient_is_delete,
            ingredient_category_id:
              item.ingredientCategory_ingredient_category_id,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.addOnRepository
        .createQueryBuilder('addOn')
        .select([
          'addOn.add_on_id',
          'addOn.is_required',
          'addOn.is_multipled',
          'addOn.add_on_price',
          'ingredient.ingredient_id',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('addOn.ingredient', 'ingredient')
        .leftJoin('addOn.owner', 'owner')
        .leftJoin('addOn.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            add_on_id: item.addOn_add_on_id,
            is_required: item.addOn_is_required,
            is_multipled: item.addOn_is_multipled,
            add_on_price: item.addOn_add_on_price,
            ingredient_id: item.ingredient_ingredient_id,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.categoryRepository
        .createQueryBuilder('category')
        .select([
          'category.category_id',
          'category.category_name',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('category.owner', 'owner')
        .leftJoin('category.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            category_id: item.category_category_id,
            category_name: item.category_category_name,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.menuRepository
        .createQueryBuilder('menu')
        .select([
          'menu.menu_id',
          'menu.menu_name',
          'menu.description',
          'menu.price',
          'menu.image_url',
          'menu.paused',
          'menu.is_delete',
          'menuTypeGroup.menu_type_group_id',
          'sweetnessGroup.sweetness_group_id',
          'sizeGroup.size_group_id',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('menu.menuTypeGroup', 'menuTypeGroup')
        .leftJoin('menu.sweetnessGroup', 'sweetnessGroup')
        .leftJoin('menu.sizeGroup', 'sizeGroup')
        .leftJoin('menu.owner', 'owner')
        .leftJoin('menu.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            menu_id: item.menu_menu_id,
            menu_name: item.menu_menu_name,
            description: item.menu_description,
            price: item.menu_price,
            image_url: item.menu_image_url,
            paused: item.menu_paused,
            is_delete: item.menu_is_delete,
            menu_type_group_id: item.menuTypeGroup_menu_type_group_id,
            sweetness_group_id: item.sweetnessGroup_sweetness_group_id,
            size_group_id: item.sizeGroup_size_group_id,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
      this.menuCategoryRepository
        .createQueryBuilder('menuCategory')
        .select([
          'menuCategory.category_id',
          'menuCategory.menu_id',
          'menuCategory.owner_id',
          'menuCategory.branch_id',
        ])
        .where('menuCategory.owner_id = :ownerId', { ownerId })
        .andWhere('menuCategory.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            category_id: item.menuCategory_category_id,
            menu_id: item.menuCategory_menu_id,
            owner_id: item.menuCategory_owner_id,
            branch_id: item.menuCategory_branch_id,
          })),
        ),
      this.menuIngredientRepository
        .createQueryBuilder('menuIngredient')
        .select([
          'menuIngredient.menu_ingredient_id',
          'menuIngredient.is_addon',
          'menuIngredient.quantity_used',
          'menu.menu_id',
          'ingredient.ingredient_id',
          'size.size_id',
          'menuType.menu_type_id',
          'owner.owner_id',
          'branch.branch_id',
        ])
        .leftJoin('menuIngredient.menu', 'menu')
        .leftJoin('menuIngredient.ingredient', 'ingredient')
        .leftJoin('menuIngredient.size', 'size')
        .leftJoin('menuIngredient.menu_type', 'menuType')
        .leftJoin('menuIngredient.owner', 'owner')
        .leftJoin('menuIngredient.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', {
          branchId: selectedBranchId,
        })
        .getRawMany()
        .then((items) =>
          items.map((item) => ({
            menu_ingredient_id: item.menuIngredient_menu_ingredient_id,
            is_addon: item.menuIngredient_is_addon,
            quantity_used: item.menuIngredient_quantity_used,
            menu_id: item.menu_menu_id,
            ingredient_id: item.ingredient_ingredient_id,
            size_id: item.size_size_id,
            menu_type_id: item.menuType_menu_type_id,
            owner_id: item.owner_owner_id,
            branch_id: item.branch_branch_id,
          })),
        ),
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
    ownerId: number,
    selectedBranchId: number,
    targetBranchId: number,
  ) {
    if (isNaN(ownerId) || isNaN(selectedBranchId) || isNaN(targetBranchId)) {
      throw new BadRequestException(
        'Invalid owner_id, selected_branch_id or target_branch_id',
      );
    }

    try {
      // เรียก GET endpoint จาก server อื่น
      const response = await axios.get(
        `http://192.168.1.43:3000/branches/owner/get-branch-setup/${selectedBranchId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            owner_id: ownerId.toString(),
          },
        },
      );

      const sourceSetup = response.data;

      // แปลง branch_id ทั้งหมดให้เป็น targetBranchId
      const updateBranchId = (obj: any) => {
        if (obj && typeof obj === 'object') {
          if ('branch_id' in obj) {
            obj.branch_id = targetBranchId;
          }
          Object.values(obj).forEach((value) => {
            if (Array.isArray(value) || typeof value === 'object') {
              updateBranchId(value);
            }
          });
        }
      };

      updateBranchId(sourceSetup);

      return {
        message: 'Branch setup cloned successfully',
        source_branch_id: selectedBranchId,
        target_branch_id: targetBranchId,
        setup_data: sourceSetup,
      };
    } catch (error) {
      console.error('Error fetching branch setup:', error.message);
      throw new BadRequestException(
        'Failed to fetch branch setup from source server',
      );
    }
  }
}
