import { Body, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Menu } from '../../entities/menu.entity';
import { UpdateMenuDto } from './dto/update-menu.dto/update-menu.dto';
import { Category } from '../../entities/category.entity';
import { Owner } from '../../entities/owner.entity';
import { Branch } from '../../entities/branch.entity';
import { SweetnessLevel } from '../../entities/sweetness-level.entity';
import { MenuType } from '../../entities/menu-type.entity';
import { AddOn } from '../../entities/add-on.entity';
import { CreateMenuDto } from './dto/create-menu/create-menu.dto';
import { Size } from 'src/entities/size.entity';
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
      categories: [category],
      owner,
      branch,
    });

    return this.menuRepository.save(newMenu);
  }

  // async createOption(type: string, createOptionDto: CreateOptionDto) {
  //   let repository: Repository<any>;
  //   switch (type) {
  //     case 'sweetness':
  //       repository = this.sweetnessRepository;
  //       break;
  //     case 'size':
  //       repository = this.sizeRepository;
  //       break;
  //     case 'add-ons':
  //       repository = this.addOnRepository;
  //       break;
  //     case 'menu-type': // Added case for menu-type
  //       repository = this.menuTypeRepository;
  //       break;
  //     default:
  //       throw new NotFoundException(`Invalid option type: ${type}`);
  //   }

  //   const menus = await this.menuRepository.findBy({
  //     menu_id: In(createOptionDto.menu_id),
  //   });

  //   if (menus.length !== createOptionDto.menu_id.length) {
  //     throw new NotFoundException(
  //       `Some menus with IDs ${createOptionDto.menu_id} not found`,
  //     );
  //   }
  //   // สร้าง option ใหม่
  //   const option = repository.create({
  //     ...createOptionDto,
  //     menus, // เชื่อม option กับเมนู
  //   });

  //   const savedOption = await repository.save(option);

  //   // อัปเดตเมนูแต่ละเมนูให้รวม menuTypes
  //   for (const menu of menus) {
  //     if (!menu.menuTypes) {
  //       menu.menuTypes = [];
  //     }
  //     menu.menuTypes.push(savedOption); // เชื่อม menuType กับเมนู
  //     await this.menuRepository.save(menu); // บันทึกการเปลี่ยนแปลง
  //   }

  //   return savedOption;
  // }

  // * ดึงเมนูทั้งหมด
  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({
      relations: ['addOns', 'sweetnessLevels', 'sizes', 'menuTypes'],
    });
  }
  // async createSizeGroup(createSizeGroupDto: CreateSizeGroupDto) {
  //   const { size_group_name, sizes, menu_id } = createSizeGroupDto;

  //   // ตรวจสอบเมนูที่ระบุใน menu_id
  //   const menus = await this.menuRepository.findBy({ menu_id: In(menu_id) });
  //   if (menus.length !== menu_id.length) {
  //     throw new NotFoundException(`Some menus with IDs ${menu_id} not found`);
  //   }

  //   // สร้าง SizeGroup พร้อม Size
  //   const sizeGroup = this.sizeGroupRepository.create({
  //     size_group_name,
  //     sizes,
  //     menus,
  //   });

  //   // บันทึก SizeGroup
  //   const savedSizeGroup = await this.sizeGroupRepository.save(sizeGroup);

  //   // อัปเดต SizeGroup ไปยังเมนูแต่ละเมนู
  //   for (const menu of menus) {
  //     if (!menu.sizeGroups) {
  //       menu.sizeGroups = [];
  //     }
  //     menu.sizeGroups.push(savedSizeGroup);
  //     await this.menuRepository.save(menu);
  //   }

  //   // เตรียม response ตามที่ต้องการ
  //   return {
  //     size_group_name: savedSizeGroup.size_group_name,
  //     sizeOption: savedSizeGroup.sizes.map((size) => ({
  //       size_name: size.size_name,
  //       size_price: size.size_price,
  //     })),
  //     menu_id: menu_id,
  //   };
  // }

  // // ดึงข้อมูล SizeGroup
  // async findSizeGroupById(size_group_id: number): Promise<SizeGroup> {
  //   const sizeGroup = await this.sizeGroupRepository.findOne({
  //     where: { size_group_id },
  //     relations: ['sizes', 'menus'],
  //   });

  //   if (!sizeGroup) {
  //     throw new NotFoundException(
  //       `SizeGroup with ID ${size_group_id} not found`,
  //     );
  //   }

  //   return sizeGroup;
  // }
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
  async createOption(type: string, createOptionDto: any) {
    let repository: Repository<any>;
    let optionKey: string;

    switch (type) {
      case 'add-ons':
        repository = this.addOnRepository;
        optionKey = 'add_on_name';
        break;
      case 'size':
        repository = this.sizeRepository;
        optionKey = 'size_name';
        break;
      case 'menu-type':
        repository = this.menuTypeRepository;
        optionKey = 'type_name';
        break;
      case 'sweetness':
        repository = this.sweetnessRepository;
        optionKey = 'level_name';
        break;
      default:
        throw new NotFoundException(`Invalid option type: ${type}`);
    }

    // ตรวจสอบว่า menu_id ที่ส่งมามีอยู่ในระบบหรือไม่
    const menus = await this.menuRepository.findBy({
      menu_id: In(createOptionDto.menu_id),
    });

    if (menus.length !== createOptionDto.menu_id.length) {
      throw new NotFoundException(
        `Some menus with IDs ${createOptionDto.menu_id} not found`,
      );
    }

    const options = [];

    if (type === 'sweetness') {
      // สร้าง sweetness option สำหรับแต่ละเมนู
      for (const level of createOptionDto.options) {
        for (const menu of menus) {
          const newOption = repository.create({
            [optionKey]: level, // ตั้งค่า level_name สำหรับ sweetness
            menu, // เชื่อมโยง option กับเมนู
          });

          const savedOption = await repository.save(newOption); // บันทึก sweetness option
          options.push(savedOption);
        }
      }
    } else if (type === 'add-ons') {
      for (const option of createOptionDto.options) {
        for (const [key, detail] of Object.entries(option)) {
          // แยก price และ unit ออกมาจาก object
          const { price, unit } = detail as { price: string; unit: number };

          const newOption = repository.create({
            [optionKey]: key, // ตัวอย่าง: "ไข่มุก" หรือ "บุก"
            ...(type === 'add-ons' ? { add_on_price: price } : {}),
            ...(type === 'add-ons' ? { unit } : {}),
            ...(type === 'add-ons'
              ? { menu_ingredient_id: createOptionDto.menu_ingredient_id }
              : {}),
          });

          const savedOption = await repository.save(newOption);
          options.push(savedOption);

          // เชื่อมโยง option กับเมนู
          for (const menu of menus) {
            if (type === 'add-ons') {
              if (!menu.addOns) menu.addOns = [];
              menu.addOns.push(savedOption);
            }
            await this.menuRepository.save(menu);
          }
        }
      }
    } else {
      // สร้าง options สำหรับ add-ons, size, หรือ menu-type
      for (const option of createOptionDto.options) {
        for (const [key, value] of Object.entries(option)) {
          const newOption = repository.create({
            [optionKey]: key,
            ...(type === 'size' ? { size_price: value } : {}),
            ...(type === 'menu-type' ? { price_difference: value } : {}),
          });

          const savedOption = await repository.save(newOption);
          options.push(savedOption);

          // เชื่อมโยง option กับเมนู
          for (const menu of menus) {
            if (type === 'size') {
              if (!menu.sizes) menu.sizes = [];
              menu.sizes.push(savedOption);
            } else if (type === 'menu-type') {
              if (!menu.menuTypes) menu.menuTypes = [];
              menu.menuTypes.push(savedOption);
            }
            await this.menuRepository.save(menu);
          }
        }
      }
    }

    return {
      message: `${type} options created successfully`,
      data: options,
    };
  }

  // async createOption(type: string, createOptionDto: any) {
  //   let repository: Repository<any>;
  //   let optionKey: string; // ชื่อคีย์ของ option ที่จะเก็บใน entity

  //   switch (type) {
  //     case 'add-ons':
  //       repository = this.addOnRepository;
  //       optionKey = 'add_on_name';
  //       break;
  //     case 'size':
  //       repository = this.sizeRepository;
  //       optionKey = 'size_name';
  //       break;
  //     case 'menu-type':
  //       repository = this.menuTypeRepository;
  //       optionKey = 'type_name';
  //       break;
  //     case 'sweetness':
  //       repository = this.sweetnessRepository;
  //       optionKey = 'level_name';
  //       break;
  //     default:
  //       throw new NotFoundException(`Invalid option type: ${type}`);
  //   }

  //   // ตรวจสอบเมนูที่เกี่ยวข้อง
  //   const menus = await this.menuRepository.findBy({
  //     menu_id: In(createOptionDto.menu_id),
  //   });

  //   if (menus.length !== createOptionDto.menu_id.length) {
  //     throw new NotFoundException(
  //       `Some menus with IDs ${createOptionDto.menu_id} not found`,
  //     );
  //   }
  //   const options = [];
  //   if (type === 'sweetness') {
  //     // สำหรับ sweetness (array ของ string)
  //     for (const level of createOptionDto.options) {
  //       const newOption = repository.create({
  //         [optionKey]: level, // level_name สำหรับ sweetness
  //         menu: menus, // เชื่อมโยงกับ menu
  //       });

  //       const savedOption = await repository.save(newOption); // บันทึก sweetness
  //       options.push(savedOption);
  //     }
  //   } else {
  //     for (const option of createOptionDto.options) {
  //       for (const [key, value] of Object.entries(option)) {
  //         const newOption = repository.create({
  //           [optionKey]: key,
  //           ...(type === 'add-ons' ? { add_on_price: value } : {}),
  //           ...(type === 'size' ? { size_price: value } : {}),
  //           ...(type === 'menu-type' ? { price_difference: value } : {}),
  //         });

  //         const savedOption = await repository.save(newOption); // บันทึก option
  //         options.push(savedOption);

  //         // อัปเดตเมนูที่เกี่ยวข้อง
  //         for (const menu of menus) {
  //           if (type === 'add-ons') {
  //             if (!menu.addOns) menu.addOns = [];
  //             menu.addOns.push(savedOption);
  //           } else if (type === 'size') {
  //             if (!menu.sizes) menu.sizes = [];
  //             menu.sizes.push(savedOption);
  //           } else if (type === 'menu-type') {
  //             if (!menu.menuTypes) menu.menuTypes = [];
  //             menu.menuTypes.push(savedOption);
  //           }
  //           await this.menuRepository.save(menu); // บันทึกเมนู
  //         }
  //       }
  //     }

  //     return {
  //       message: `${type} options created successfully`,
  //       data: options,
  //     };
  //   }
  // }

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
