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
      this.sweetnessLevelRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: ['owner', 'branch'],
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
        relations: ['owner', 'branch', 'sweetnessLevel'],
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
        relations: ['owner', 'branch'],
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
        relations: ['owner', 'branch', 'menuType'],
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
        relations: ['owner', 'branch'],
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
        relations: ['owner', 'branch', 'ingredientCategory'],
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
        relations: ['owner', 'branch', 'ingredient'],
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
        relations: ['owner', 'branch'],
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
        relations: [
          'owner',
          'branch',
          'menuTypeGroup',
          'sweetnessGroup',
          'sizeGroup',
        ],
        select: {
          menu_id: true,
          menu_name: true,
          description: true,
          price: true,
          image_url: true,
          paused: true,
          is_delete: true,
          owner: {
            owner_id: true,
          },
          branch: {
            branch_id: true,
          },
          menuTypeGroup: {
            menu_type_group_id: true,
          },
          sweetnessGroup: {
            sweetness_group_id: true,
          },
          sizeGroup: {
            size_group_id: true,
          },
        },
      }),
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
      this.menuIngredientRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: selectedBranchId },
        },
        relations: [
          'owner',
          'branch',
          'menu',
          'ingredient',
          'size',
          'menu_type',
        ],
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

      // Log ข้อมูลออกมา
      console.log('Source Branch Setup:', JSON.stringify(sourceSetup, null, 2));

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
