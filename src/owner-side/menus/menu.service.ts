import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, In, Repository } from 'typeorm';
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
  ) {}

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
  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({
      relations: ['addOns', 'sweetnessLevels', 'sizes', 'menuTypes'],
    });
  }

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

  // สร้าง option
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
    }
    else if (type === 'add-ons') {
      for (const option of createOptionDto.options) {
        for (const [ingredientName, detail] of Object.entries(option)) {
          const { price, unit } = detail as { price: string; unit: number };

          // 1. **Check if the add-on exists, create if not**
          let addOn = await this.addOnRepository.findOne({
            where: { add_on_name: ingredientName },
          });

          if (!addOn) {
            addOn = this.addOnRepository.create({
              add_on_name: ingredientName,
              add_on_price: parseFloat(price),
            });
            await this.addOnRepository.save(addOn);
          }
          console.log("ADD-ON:", addOn);

          // 2. **Check if the ingredient exists, create if not**
          let ingredient = await this.ingredientRepository.findOne({
            where: { ingredient_name: ingredientName },
          });

          if (!ingredient) {
            ingredient = this.ingredientRepository.create({
              ingredient_name: ingredientName,
            });
            await this.ingredientRepository.save(ingredient);
          }
          console.log("INGREDIENT:", ingredient);

          console.log(addOn)


          // 3. **Link to `menu_ingredient` table**
          for (const menuId of createOptionDto.menu_id) {
            let menuIngredient = await this.menuIngredientRepository.findOne({
              where: {
                menu_id: menuId,
                add_on: Equal(addOn.add_on_id),
                ingredient_id: Equal(ingredient.ingredient_id),
              },
            });

            if (!menuIngredient) {
              menuIngredient = this.menuIngredientRepository.create({
                menu_id: menuId,
                add_on: addOn,
                ingredient_id: ingredient,
                quantity_used: unit,
              });
              await this.menuIngredientRepository.save(menuIngredient);
            }
            console.log("MENU INGREDIENT:", menuIngredient);
          }
        }
      }
    }
    else {
      // สร้าง options สำหรับ add-ons, size, หรือ menu-type
      for (const option of createOptionDto.options) {
        for (const [key, value] of Object.entries(option)) {
          const newOption = repository.create({
            [optionKey]: key,
            ...(type === 'size' ? { size_price: value } : {}),
          });

          const savedOption = await repository.save(newOption);
          options.push(savedOption);

          // เชื่อมโยง option กับเมนู
          for (const menu of menus) {
            if (type === 'size') {
              if (!menu.sizes) menu.sizes = [];
              menu.sizes.push(savedOption);
              savedOption.menu = menu; // ✅ ตั้งค่า reverse relation ให้ชัดเจน
              await this.menuRepository.save(menu); // บันทึก Menu
              await repository.save(savedOption);
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
  async updateStock(
    menu_id: number,
    owner_id: number,
    branch_id: number,
    linkMenuToStockDtoList: LinkMenuToStockDto[],
  ) {
    for (const linkMenuToStockDto of linkMenuToStockDtoList) {
      const { ingredient_name, unit, ingredientListForStock } =
        linkMenuToStockDto;

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
        const size = await this.sizeRepository.findOne({
          where: { size_id: property.size_id },
        });
        if (!size) {
          throw new NotFoundException(
            `Size with ID ${property.size_id} not found`,
          );
        }

        const menuType = await this.menuTypeRepository.findOne({
          where: { menu_type_id: property.menu_type_id },
        });
        if (!menuType) {
          throw new NotFoundException(
            `MenuType with ID ${property.menu_type_id} not found`,
          );
        }
      }

      // Find by ingredient name or create ingredient => if not have in ingredient table
      let ingredient = await this.ingredientRepository.findOne({
        where: { ingredient_name },
      });
      if (!ingredient) {
        ingredient = this.ingredientRepository.create({
          ingredient_name,
          unit,
          owner_id: owner,
        });
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

  // async updateOption(type: string, optionId: number, updateOptionDto: any) {
  //   const columnMap = {
  //     'add-ons': {
  //       repository: this.addOnRepository,
  //       optionKey: 'add_on_name',
  //       idColumn: 'add_on_id',
  //       relationField: 'addOns',
  //     },
  //     size: {
  //       repository: this.sizeRepository,
  //       optionKey: 'size_name',
  //       idColumn: 'size_id',
  //       relationField: 'sizes',
  //     },
  //     'menu-type': {
  //       repository: this.menuTypeRepository,
  //       optionKey: 'type_name',
  //       idColumn: 'menu_type_id',
  //       relationField: 'menuTypes',
  //     },
  //     sweetness: {
  //       repository: this.sweetnessRepository,
  //       optionKey: 'level_name',
  //       idColumn: 'sweetness_id',
  //       relationField: 'sweetnessLevels',
  //     },
  //   };

  //   if (!columnMap[type]) {
  //     throw new NotFoundException(`Invalid option type: ${type}`);
  //   }

  //   const { repository, optionKey, idColumn, relationField } = columnMap[type];

  //   const existingOption = await repository.findOne({
  //     where: { [idColumn]: optionId },
  //     relations: ['menu'],
  //   });

  //   if (!existingOption) {
  //     throw new NotFoundException(`Option with ID ${optionId} not found`);
  //   }

  //   // 🔹 อัปเดตค่าตามประเภท
  //   if (updateOptionDto.name) {
  //     existingOption[optionKey] = updateOptionDto.name;
  //   }

  //   if (type === 'add-ons') {
  //     existingOption.add_on_price = updateOptionDto.price
  //       ? parseFloat(updateOptionDto.price)
  //       : existingOption.add_on_price;
  //     existingOption.unit = updateOptionDto.unit
  //       ? parseInt(updateOptionDto.unit, 10)
  //       : existingOption.unit;
  //   } else if (type === 'size') {
  //     existingOption.size_price = updateOptionDto.size_price
  //       ? parseFloat(updateOptionDto.size_price)
  //       : existingOption.size_price;
  //   } else if (type === 'menu-type') {
  //     existingOption.price_difference = updateOptionDto.price_difference
  //       ? parseFloat(updateOptionDto.price_difference)
  //       : existingOption.price_difference;
  //   }
  //   if (updateOptionDto.menu_id) {
  //     const menus = await this.menuRepository.findBy({
  //       menu_id: In(updateOptionDto.menu_id),
  //     });

  //     if (menus.length !== updateOptionDto.menu_id.length) {
  //       throw new NotFoundException(
  //         `Some menus with IDs ${updateOptionDto.menu_id} not found`,
  //       );
  //     }
  //     existingOption.menu = null;
  //     await repository.save(existingOption);

  //     // สร้างความสัมพันธ์ใหม่
  //     for (const menu of menus) {
  //       if (!menu[relationField]) menu[relationField] = [];
  //       menu[relationField].push(existingOption);
  //       await this.menuRepository.save(menu);
  //     }
  //   }

  //   await repository.save(existingOption);

  //   return {
  //     message: `${type} option updated successfully`,
  //     data: existingOption,
  //   };
  // }
  async updateOption(type: string, optionId: number, updateOptionDto: any) {
    const columnMap = {
      'add-ons': {
        repository: this.addOnRepository,
        optionKey: 'add_on_name',
        idColumn: 'add_on_id',
        relationField: 'addOns',
      },
      size: {
        repository: this.sizeRepository,
        optionKey: 'size_name',
        idColumn: 'size_id',
        relationField: 'sizes',
      },
      'menu-type': {
        repository: this.menuTypeRepository,
        optionKey: 'type_name',
        idColumn: 'menu_type_id',
        relationField: 'menuTypes',
      },
      sweetness: {
        repository: this.sweetnessRepository,
        optionKey: 'level_name',
        idColumn: 'sweetness_id',
        relationField: 'sweetnessLevels',
      },
    };

    if (!columnMap[type]) {
      throw new NotFoundException(`Invalid option type: ${type}`);
    }

    const { repository, optionKey, idColumn, relationField } = columnMap[type];

    const existingOption = await repository.findOne({
      where: { [idColumn]: optionId },
      relations: ['menu'], // โหลดความสัมพันธ์ปัจจุบัน
    });

    if (!existingOption) {
      throw new NotFoundException(`Option with ID ${optionId} not found`);
    }

    // ✅ อัปเดตชื่อและข้อมูลอื่นๆ
    if (updateOptionDto.name) {
      existingOption[optionKey] = updateOptionDto.name;
    }

    if (type === 'add-ons') {
      existingOption.add_on_price = updateOptionDto.price
        ? parseFloat(updateOptionDto.price)
        : existingOption.add_on_price;
      existingOption.unit = updateOptionDto.unit
        ? parseInt(updateOptionDto.unit, 10)
        : existingOption.unit;
    } else if (type === 'size') {
      existingOption.size_price = updateOptionDto.size_price
        ? parseFloat(updateOptionDto.size_price)
        : existingOption.size_price;
    } else if (type === 'menu-type') {
      existingOption.price_difference = updateOptionDto.price_difference
        ? parseFloat(updateOptionDto.price_difference)
        : existingOption.price_difference;
    }

    // ✅ จัดการกับ menu_id ใหม่
    if (updateOptionDto.menu_id) {
      const menus = await this.menuRepository.find({
        where: { menu_id: In(updateOptionDto.menu_id) },
        relations: [relationField], // โหลดความสัมพันธ์เดิม
      });

      if (menus.length !== updateOptionDto.menu_id.length) {
        throw new NotFoundException(
          `Some menus with IDs ${updateOptionDto.menu_id} not found`,
        );
      }

      // ✅ ลบความสัมพันธ์เก่า
      const oldMenuIds = Array.isArray(existingOption.menu)
        ? existingOption.menu.map((m) => m.menu_id)
        : existingOption.menu
          ? [existingOption.menu.menu_id]
          : [];

      const oldMenus = await this.menuRepository.find({
        where: { menu_id: In(oldMenuIds) },
        relations: [relationField],
      });

      for (const oldMenu of oldMenus) {
        oldMenu[relationField] = oldMenu[relationField].filter(
          (opt) => opt[idColumn] !== optionId,
        );
        await this.menuRepository.save(oldMenu);
      }

      // ✅ เพิ่มความสัมพันธ์ใหม่
      for (const newMenu of menus) {
        if (!newMenu[relationField]) {
          newMenu[relationField] = [];
        }
        if (!newMenu[relationField].some((opt) => opt[idColumn] === optionId)) {
          newMenu[relationField].push(existingOption);
        }
        await this.menuRepository.save(newMenu);
      }
    }

    await repository.save(existingOption); // ✅ บันทึกการอัปเดตของ Option

    return {
      message: `${type} option updated successfully`,
      data: existingOption,
    };
  }

  async getOptions(type: string): Promise<any[]> {
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

    // ✅ ดึงข้อมูล Options จากฐานข้อมูล
    const options = await repository.find();

    return options.map((option) => ({
      id: option.id || option[`${type}_id`], // ✅ ใช้ id ที่ถูกต้อง
      name: option[optionKey], // ✅ ชื่อ option เช่น `ไข่มุก`, `big`, `50%`
      ...(type === 'add-ons' ? { add_on_price: option.add_on_price } : {}),
      ...(type === 'add-ons' ? { unit: option.unit } : {}),
      ...(type === 'size' ? { size_price: option.size_price } : {}),
      ...(type === 'menu-type'
        ? { price_difference: option.price_difference }
        : {}),
    }));
  }
}
