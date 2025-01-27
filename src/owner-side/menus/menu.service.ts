import { Body, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from '../../entities/menu.entity';
import { UpdateMenuDto } from './dto/update-menu.dto/update-menu.dto';
import { Category } from '../../entities/category.entity';
import { Owner } from '../../entities/owner.entity';
import { Branch } from '../../entities/branch.entity';
import { SweetnessLevel } from '../../entities/sweetness-level.entity';
import { Size } from '../../entities/size.entity';
import { MenuType } from '../../entities/menu-type.entity';
import { AddOn } from '../../entities/add-on.entity';
import { CreateOptionDto } from './dto/create-option/create-option.dto';
import { CreateMenuDto } from './dto/create-menu/create-menu.dto';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { IngredientMenuLink } from 'src/entities/ingredient-menu-link.entity';
import { LinkMenuToStockDto } from './dto/link-stock/link-menu-to-stock.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(AddOn)
    private readonly addOnRepository: Repository<AddOn>,

    @InjectRepository(MenuType)
    private readonly menuTypeRepository: Repository<MenuType>,

    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,

    @InjectRepository(SweetnessLevel)
    private readonly sweetnessRepository: Repository<SweetnessLevel>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>, // Inject CategoryRepository

    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    @InjectRepository(MenuIngredient)
    private readonly menuIngredientRepository: Repository<MenuIngredient>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,

    @InjectRepository(IngredientMenuLink)
    private readonly ingredientMenuLinkRepository: Repository<IngredientMenuLink>,
  ) { }

  // * สร้างเมนูใหม่
  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    const { category_id, owner_id, branch_id, ...menuData } = createMenuDto;

    // โหลดข้อมูล Category
    const category = await this.categoryRepository.findOne({
      where: { category_id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${category_id} not found`);
    }

    // โหลดข้อมูล Owner
    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    // โหลดข้อมูล Branch
    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branch_id} not found`);
    }

    // สร้างเมนูใหม่
    const newMenu = this.menuRepository.create({
      ...menuData,
      category,
      owner,
      branch,
    });

    return this.menuRepository.save(newMenu);
  }

  // * เพิ่มความสัมพันธ์ระหว่าง Menu และ Ingredient
  // async addIngredientToMenu(
  //   menu_id: number,
  //   ingredient_id: number,
  //   quantity_used: number,
  // ) {
  //   const menu = await this.menuRepository.findOne({ where: { menu_id } });
  //   if (!menu) {
  //     throw new NotFoundException(`Menu with ID ${menu_id} not found`);
  //   }

  //   const ingredientLink = this.ingredientMenuLinkRepository.create({
  //     menu,
  //     ingredient: { ingredient_id } as any,
  //     quantity_used,
  //   });

  //   return this.ingredientMenuLinkRepository.save(ingredientLink);
  // }

  // * อัปเดตปริมาณวัตถุดิบในเมนู
  // async updateIngredientInMenu(
  //   menu_ingredient_id: number,
  //   quantity_used: number,
  // ) {
  //   const ingredientLink = await this.ingredientMenuLinkRepository.findOne({
  //     where: { menu_ingredient_id },
  //   });

  //   if (!ingredientLink) {
  //     throw new NotFoundException(
  //       `IngredientMenuLink with ID ${menu_ingredient_id} not found`,
  //     );
  //   }

  //   ingredientLink.quantity_used = quantity_used;
  //   return this.ingredientMenuLinkRepository.save(ingredientLink);
  // }

  // * ลบวัตถุดิบออกจากเมนู
  // async deleteIngredientFromMenu(menu_ingredient_id: number): Promise<void> {
  //   const ingredientLink = await this.ingredientMenuLinkRepository.findOne({
  //     where: { menu_ingredient_id },
  //   });

  //   if (!ingredientLink) {
  //     throw new NotFoundException(
  //       `IngredientMenuLink with ID ${menu_ingredient_id} not found`,
  //     );
  //   }

  //   await this.ingredientMenuLinkRepository.remove(ingredientLink);
  // }

  // * ดึงวัตถุดิบทั้งหมดในเมนู
  // async getIngredientsByMenu(menu_id: number) {
  //   return this.ingredientMenuLinkRepository.find({
  //     where: { menu: { menu_id } },
  //     relations: ['menu', 'ingredient'],
  //   });
  // }

  // * สร้างตัวเลือกให้กับเมนู
  async createOption(type: string, createOptionDto: CreateOptionDto) {
    let repository: Repository<any>;

    switch (type) {
      case 'sweetness':
        repository = this.sweetnessRepository;
        break;
      case 'size':
        repository = this.sizeRepository;
        break;
      case 'add-ons':
        repository = this.addOnRepository;
        break;
      case 'menu-type':
        repository = this.menuTypeRepository;
        break;
      default:
        throw new NotFoundException(`Invalid option type: ${type}`);
    }

    const menu = await this.menuRepository.findOne({
      where: { menu_id: createOptionDto.menu_id },
    });
    if (!menu) {
      throw new NotFoundException(
        `Menu with ID ${createOptionDto.menu_id} not found`,
      );
    }

    const option = repository.create({
      ...createOptionDto,
      menu,
    });

    return repository.save(option);
  }

  // * เชื่อมตัวเลือกกับเมนู
  async linkOptionToMenu(
    menu_id: number,
    type: string,
    option_id: number,
  ): Promise<Menu> {
    const menu = await this.menuRepository.findOne({ where: { menu_id } });
    if (!menu) throw new NotFoundException(`Menu with ID ${menu_id} not found`);

    let repository: Repository<any>;
    let relationField: string;

    switch (type) {
      case 'sweetness':
        repository = this.sweetnessRepository;
        relationField = 'sweetnessLevels';
        break;
      case 'size':
        repository = this.sizeRepository;
        relationField = 'sizes';
        break;
      case 'add-ons':
        repository = this.addOnRepository;
        relationField = 'addOns';
        break;
      case 'menu-type':
        repository = this.menuTypeRepository;
        relationField = 'menuTypes';
        break;
      default:
        throw new NotFoundException(`Invalid option type: ${type}`);
    }

    const option = await repository.findOne({ where: { id: option_id } });
    if (!option)
      throw new NotFoundException(`Option with ID ${option_id} not found`);

    menu[relationField].push(option);
    return this.menuRepository.save(menu);
  }

  // * ดึงเมนูทั้งหมด
  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({
      relations: ['addOns', 'sweetnessLevels', 'sizes', 'menuTypes'],
    });
  }

  // * ดึงเมนูตาม ID
  async findOne(menu_id: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { menu_id },
      relations: ['addOns', 'sweetnessLevels', 'sizes', 'menuTypes'],
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menu_id} not found`);
    }

    return menu;
  }

  // * อัปเดตเมนู
  async update(menu_id: number, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.findOne(menu_id);
    Object.assign(menu, updateMenuDto);
    return this.menuRepository.save(menu);
  }

  // * ลบเมนู
  async remove(menu_id: number): Promise<void> {
    const menu = await this.findOne(menu_id);
    await this.menuRepository.remove(menu);
  }

  // * link menu for auto cut stock
  async updateStock(menu_id: number, owner_id: number, branch_id: number, linkMenuToStockDtoList: LinkMenuToStockDto[]) {
    for (const linkMenuToStockDto of linkMenuToStockDtoList) {
      const { ingredient_name, unit, ingredientListForStock } = linkMenuToStockDto;

      const menu = await this.menuRepository.findOne({ where: { menu_id } });
      if (!menu) {
        throw new NotFoundException(`Menu with ID ${menu_id} not found`);
      }

      const owner = await this.ownerRepository.findOne({ where: { owner_id } });
      if (!owner) {
        throw new NotFoundException(`Owner with ID ${owner_id} not found`);
      }

      // check size, menu type id from each table
      for (const property of ingredientListForStock) {
        const size = await this.sizeRepository.findOne({ where: { size_id: property.size_id } });
        if (!size) {
          throw new NotFoundException(`Size with ID ${property.size_id} not found`);
        }

        const menuType = await this.menuTypeRepository.findOne({ where: { menu_type_id: property.menu_type_id } });
        if (!menuType) {
          throw new NotFoundException(`MenuType with ID ${property.menu_type_id} not found`);
        }
      }

      // Find by ingredient name or create ingredient => if not have in ingredient table
      let ingredient = await this.ingredientRepository.findOne({
        where: { ingredient_name },
      });
      if (!ingredient) {
        ingredient = this.ingredientRepository.create({ ingredient_name, unit, owner_id: owner });
        ingredient = await this.ingredientRepository.save(ingredient);
      }

      // Save the MenuIngredient records
      const menuIngredientsToSave = ingredientListForStock.map((property) => ({
        menu_id: menu,
        ingredient_id: ingredient,
        size_id: { size_id: property.size_id },
        menu_type_id: { menu_type_id: property.menu_type_id },
        quantity_used: property.quantity_used,
      }));

      await this.menuIngredientRepository.save(menuIngredientsToSave);
    }

    return { message: 'Link Stock successfully' };
  }
}
