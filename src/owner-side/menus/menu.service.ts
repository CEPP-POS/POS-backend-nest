import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, In, Repository } from 'typeorm';
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
    private readonly dataSource: DataSource,
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
    let relationField: string;

    switch (type) {
      case 'add-ons':
        repository = this.addOnRepository;
        optionKey = 'add_on_name';
        relationField = 'addOns';
        break;
      case 'size':
        repository = this.sizeRepository;
        optionKey = 'size_name';
        relationField = 'sizes';
        break;
      case 'menu-type':
        repository = this.menuTypeRepository;
        optionKey = 'type_name';
        relationField = 'menuTypes';
        break;
      case 'sweetness':
        repository = this.sweetnessRepository;
        optionKey = 'level_name';
        relationField = 'sweetnessLevels';
        break;
      default:
        throw new NotFoundException(`Invalid option type: ${type}`);
    }
    const menus = await this.menuRepository.find({
      where: { menu_id: In(createOptionDto.menu_id) },
      relations: [relationField], // โหลดความสัมพันธ์ที่เกี่ยวข้อง
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
        for (const [ingredientName, detail] of Object.entries(option)) {
          const { price, unit } = detail as { price: string; unit: number };

          // 1. **Check if the ingredient exists, create if not**
          let ingredient = await this.ingredientRepository.findOne({
            where: { ingredient_name: ingredientName },
          });

          if (!ingredient) {
            ingredient = this.ingredientRepository.create({
              ingredient_name: ingredientName,
            });
            await this.ingredientRepository.save(ingredient);
          }
          console.log('INGREDIENT:', ingredient);

          for (const menuId of createOptionDto.menu_id) {
            // 2. **Check if the add-on exists for this menu, create if not**
            let addOn = await this.addOnRepository.findOne({
              where: { add_on_name: ingredientName, menu: { menu_id: menuId } },
            });

            if (!addOn) {
              addOn = this.addOnRepository.create({
                add_on_name: ingredientName,
                add_on_price: parseFloat(price),
                menu: { menu_id: menuId },
              });
              await this.addOnRepository.save(addOn);
            }
            console.log('ADD-ON:', addOn);

            // 3. **Link to `menu_ingredient` table**
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
            console.log('MENU INGREDIENT:', menuIngredient);
          }
        }
      }
    } else if (type === 'menu-type') {
      await this.dataSource.transaction(async (manager) => {
        // ✅ ใช้ Transaction
        const menus = await manager.find(Menu, {
          where: { menu_id: In(createOptionDto.menu_id) },
          relations: ['menuTypes'], // ✅ โหลดความสัมพันธ์กับ menuTypes
        });

        const options = [];

        for (const option of createOptionDto.options) {
          for (const [typeName, price] of Object.entries(option)) {
            for (const menu of menus) {
              // ✅ ค้นหา MenuType ที่เชื่อมโยงกับ Menu โดยเฉพาะ
              let menuType = await manager.findOne(MenuType, {
                where: {
                  type_name: typeName,
                  menu: { menu_id: menu.menu_id }, // ✅ ค้นหาแบบเจาะจงเมนู
                },
                relations: ['menu'],
              });

              // ✅ ถ้าไม่มี MenuType ให้สร้างใหม่สำหรับเมนูนี้
              if (!menuType) {
                menuType = manager.create(MenuType, {
                  type_name: typeName,
                  price_difference: Number(price),
                  menu: { menu_id: menu.menu_id }, // ✅ เชื่อมโยงกับเมนู
                });
                await manager.save(menuType);
              }

              // ✅ ตรวจสอบการเชื่อมโยงเพื่อป้องกันการเพิ่มซ้ำ
              const isAlreadyLinked = menu.menuTypes.some(
                (linkedType) =>
                  linkedType.menu_type_id === menuType.menu_type_id,
              );

              if (!isAlreadyLinked) {
                await manager
                  .createQueryBuilder()
                  .relation(Menu, 'menuTypes')
                  .of(menu.menu_id)
                  .add(menuType.menu_type_id);

                menu.menuTypes.push(menuType); // ✅ อัปเดตใน Memory
                await manager.save(menu); // ✅ บันทึกใน Database
              }

              options.push(menuType);
            }
          }
        }

        return {
          message: `Menu types created and linked successfully`,
          data: options,
        };
      });
    } else {
      const menus = await this.menuRepository.find({
        where: { menu_id: In(createOptionDto.menu_id) },
        relations: ['sizes'], // ✅ โหลด relation ด้วย
      });
      const options = [];

      for (const option of createOptionDto.options) {
        for (const [sizeName, sizePrice] of Object.entries(option)) {
          // ✅ ตรวจสอบว่ามี Size สำหรับเมนูนี้อยู่แล้วหรือไม่
          for (const menu of menus) {
            let existingSize = await this.sizeRepository.findOne({
              where: { size_name: sizeName, menu: { menu_id: menu.menu_id } },
              relations: ['menu'],
            });

            // ✅ ถ้าไม่มี Size ให้สร้างใหม่
            if (!existingSize) {
              existingSize = this.sizeRepository.create({
                size_name: sizeName,
                size_price: Number(sizePrice),
                menu: { menu_id: menu.menu_id }, // ✅ เชื่อมโยงกับเมนู
              });
              await this.sizeRepository.save(existingSize);
            }

            // ✅ ตรวจสอบการเชื่อมโยงเพื่อป้องกันการเพิ่มซ้ำ
            const isAlreadyLinked = menu.sizes.some(
              (linkedSize) => linkedSize.size_id === existingSize.size_id,
            );

            if (!isAlreadyLinked) {
              menu.sizes.push(existingSize); // ✅ อัปเดตใน Memory
              await this.menuRepository.save(menu); // ✅ บันทึกการเชื่อมโยง
            }

            options.push(existingSize);
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
  async updateOptionnew(type: string, optionId: number, updateOptionDto: any) {
    const optionConfig = {
      'menu-type': {
        repository: this.menuTypeRepository,
        optionKey: 'type_name',
        idKey: 'menu_type_id',
        priceKey: 'price_difference',
        relation: 'menuTypes',
      },
      size: {
        repository: this.sizeRepository,
        optionKey: 'size_name',
        idKey: 'size_id',
        priceKey: 'size_price',
        relation: 'sizes',
      },
      'add-ons': {
        repository: this.addOnRepository,
        optionKey: 'add_on_name',
        idKey: 'add_on_id',
        priceKey: 'add_on_price',
        relation: 'addOns',
      },
      sweetness: {
        repository: this.sweetnessRepository,
        optionKey: 'level_name',
        idKey: 'sweetness_id',
        relation: 'sweetnessLevels',
      },
    };

    if (!optionConfig[type]) {
      throw new NotFoundException(`Invalid option type: ${type}`);
    }

    const { repository, optionKey, idKey, priceKey } = optionConfig[type];

    // ✅ ดึง Option ตาม ID
    const existingOption = await repository.findOne({
      where: { [idKey]: optionId },
      relations: ['menu'],
    });

    if (!existingOption) {
      throw new NotFoundException(`Option with ID ${optionId} not found`);
    }

    const oldName = existingOption[optionKey]; // ✅ ชื่อเก่าที่จะใช้ค้นหา

    // ✅ อัปเดตชื่อใหม่
    if (updateOptionDto.name) {
      existingOption[optionKey] = updateOptionDto.name;
    }

    // ✅ อัปเดตราคา (ถ้ามี)
    if (priceKey && updateOptionDto[priceKey] !== undefined) {
      existingOption[priceKey] = parseFloat(updateOptionDto[priceKey]);
    }

    await repository.save(existingOption); // ✅ บันทึก Option หลัก

    // ✅ ค้นหาและอัปเดต Option อื่น ๆ ที่มีชื่อเดิม
    if (updateOptionDto.menu_id) {
      const relatedOptions = await repository.find({
        where: {
          [optionKey]: oldName,
          menu: In(updateOptionDto.menu_id),
        },
      });

      for (const option of relatedOptions) {
        option[optionKey] = updateOptionDto.name; // ✅ เปลี่ยนชื่อใหม่
        if (priceKey && updateOptionDto[priceKey] !== undefined) {
          option[priceKey] = parseFloat(updateOptionDto[priceKey]); // ✅ อัปเดตราคา
        }
        await repository.save(option);
      }
    }

    return {
      message: `${type} updated successfully`,
      data: existingOption,
    };
  }
  async updateOption(type: string, optionId: number, updateOptionDto: any) {
    const columnMap = {
      'menu-type': {
        repository: this.menuTypeRepository,
        optionKey: 'type_name',
        idColumn: 'menu_type_id',
        relationField: 'menuTypes',
      },
      size: {
        repository: this.sizeRepository,
        optionKey: 'size_name',
        idColumn: 'size_id',
        relationField: 'sizes',
      },
      'add-ons': {
        repository: this.addOnRepository,
        optionKey: 'add_on_name',
        idColumn: 'add_on_id',
        relationField: 'addOns',
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

    // ✅ ดึงข้อมูล Option จาก ID ที่ส่งมา
    const existingOption = await repository.findOne({
      where: { [idColumn]: optionId },
      relations: ['menu'],
    });

    if (!existingOption) {
      throw new NotFoundException(`Option with ID ${optionId} not found`);
    }

    const oldName = existingOption[optionKey]; // ✅ เก็บชื่อเก่าเพื่อนำไปค้นหาในเมนูอื่น

    // ✅ อัปเดตชื่อและข้อมูลใหม่
    if (updateOptionDto.name) {
      existingOption[optionKey] = updateOptionDto.name;
    }

    if (type === 'menu-type' && updateOptionDto.price_difference) {
      existingOption.price_difference = parseFloat(
        updateOptionDto.price_difference,
      );
    }
    if (type === 'size' && updateOptionDto.size_price) {
      existingOption.size_price = parseFloat(updateOptionDto.size_price);
    }
    if (type === 'add-ons' && updateOptionDto.options) {
      if (type === 'add-ons' && updateOptionDto.options) {
        const [addOnName, details] =
          Object.entries(updateOptionDto.options[0])[0] || [];

        if (!addOnName || !details) {
          throw new BadRequestException(
            `Invalid add-on data. Missing name or details.`,
          );
        }

        const { price, unit } = details as { price: number; unit: number };

        existingOption[optionKey] = addOnName;
        existingOption.add_on_price = price;
        existingOption.unit = unit;
      }
    }

    await repository.save(existingOption); // ✅ บันทึก Option ที่ถูกอัปเดต

    // ✅ อัปเดตสำหรับ menu_id ที่ระบุเท่านั้น
    if (updateOptionDto.menu_id) {
      const menus = await this.menuRepository.find({
        where: { menu_id: In(updateOptionDto.menu_id) },
        relations: [relationField],
      });

      for (const menu of menus) {
        // ✅ ตรวจสอบว่ามี Option เดิมที่ชื่อเหมือนกันหรือไม่
        const optionInMenu = menu[relationField].find(
          (opt) => opt[optionKey] === oldName,
        );

        if (optionInMenu) {
          // ✅ ถ้ามี → อัปเดตชื่อใหม่
          optionInMenu[optionKey] = updateOptionDto.name;
          await repository.save(optionInMenu);
        } else {
          // ✅ ถ้าไม่มี → สร้างใหม่
          const newOption = repository.create({
            [optionKey]: updateOptionDto.name,
            ...(type === 'size' && updateOptionDto.size_price
              ? { size_price: updateOptionDto.size_price }
              : {}),
            ...(type === 'menu-type' && updateOptionDto.price_difference
              ? { price_difference: updateOptionDto.price_difference }
              : {}),
            menu: { menu_id: menu.menu_id },
          });

          await repository.save(newOption);

          // ✅ เพิ่ม Option ใหม่ลงในเมนู
          menu[relationField].push(newOption);
          await this.menuRepository.save(menu);
        }
      }
    }

    return {
      message: `${type} option updated successfully`,
      data: existingOption,
    };
  }

  // async updateOption2(type: string, optionId: number, updateOptionDto: any) {
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

  //   // ✅ 1. ค้นหา Option ตาม ID
  //   const existingOption = await repository.findOne({
  //     where: { [idColumn]: optionId },
  //     relations: ['menu'], // โหลดความสัมพันธ์กับเมนู
  //   });

  //   if (!existingOption) {
  //     throw new NotFoundException(`Option with ID ${optionId} not found`);
  //   }

  //   // ✅ 2. ค้นหา Option ทั้งหมดที่มีชื่อเดียวกัน
  //   const relatedOptions = await repository.find({
  //     where: { [optionKey]: existingOption[optionKey] },
  //     relations: ['menu'],
  //   });

  //   if (updateOptionDto.name) {
  //     for (const option of relatedOptions) {
  //       option[optionKey] = updateOptionDto.name;
  //       await repository.save(option);
  //     }
  //   }

  //   // ✅ 3. จัดการกับ menu_id ใหม่
  //   if (updateOptionDto.menu_id) {
  //     const menus = await this.menuRepository.find({
  //       where: { menu_id: In(updateOptionDto.menu_id) },
  //       relations: [relationField],
  //     });

  //     if (menus.length !== updateOptionDto.menu_id.length) {
  //       throw new NotFoundException(
  //         `Some menus with IDs ${updateOptionDto.menu_id} not found`,
  //       );
  //     }

  //     for (const menu of menus) {
  //       // ✅ ตรวจสอบว่ามี Option ที่เกี่ยวข้องกับเมนูนี้หรือไม่
  //       let linkedOption = menu[relationField]?.find(
  //         (opt) => opt[optionKey] === existingOption[optionKey],
  //       );

  //       // ✅ ถ้าไม่มี Option เดิมในเมนูนี้ ให้สร้างใหม่
  //       if (!linkedOption) {
  //         linkedOption = repository.create({
  //           [optionKey]: updateOptionDto.name || existingOption[optionKey],
  //         });
  //         await repository.save(linkedOption);

  //         // ✅ เชื่อมโยง Option ใหม่กับเมนู
  //         if (!menu[relationField]) {
  //           menu[relationField] = [];
  //         }
  //         menu[relationField].push(linkedOption);
  //         await this.menuRepository.save(menu);
  //       } else {
  //         // ✅ ถ้ามีอยู่แล้ว ให้ทำการอัปเดตชื่อ
  //         linkedOption[optionKey] =
  //           updateOptionDto.name || linkedOption[optionKey];
  //         await repository.save(linkedOption);
  //       }
  //     }
  //   }

  //   return {
  //     message: `${type} option updated successfully`,
  //     data: relatedOptions,
  //   };
  // }

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
      id:
        option.id ||
        option[`${type}_id`] ||
        option['menu_type_id'] ||
        option['add_on_id'], // ✅ ใช้ id ที่ถูกต้อง
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
