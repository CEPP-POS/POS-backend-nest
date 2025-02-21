import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { LinkMenuToStockDto } from './dto/link-stock/link-menu-to-stock.dto';
import { join } from 'path';
import { CreateSizeDto } from './dto/create-option/create-size.dto';
import { SizeGroup } from 'src/entities/size-group.entity';

@Injectable()
export class MenuService {
  // upload local storage image
  private uploadFolder = join(__dirname, '..', 'uploads');

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
    private readonly sweetnessLevelRepository: Repository<SweetnessLevel>,

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

    @InjectRepository(SizeGroup)
    private readonly sizeGroupRepository: Repository<SizeGroup>,

  ) { }

  // upload picture to local
  handleFileUpload(file: Express.Multer.File) {
    console.log('upload picture');
    if (!file) {
      throw new BadRequestException('no file uploaded');
    }

    // validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('invalid file type');
    }

    // validate file size (e.g., max 5mb)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('file is too large!');
    }

    return { message: 'File uploaded successfully', filePath: file.path };
  }

  // * สร้างเมนูใหม่
  async create(createMenuDto: CreateMenuDto): Promise<any> {
    const { owner_id, branch_id, menu_name, ...menuData } = createMenuDto;
    // เช็กว่ามี Owner นี้
    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    // เช็กว่าเจอ Branch นี้
    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branch_id} not found`);
    }

    // 🔍 Check for duplicate menu name
    const duplicateMenu = await this.menuRepository.findOne({
      where: { menu_name },
    });
    if (duplicateMenu) {
      throw new ConflictException(
        `Menu with name "${menu_name}" already exists`,
      );
    }

    // สร้างเมนูใหม่ แบบยังไม่ผูก category
    const newMenu = this.menuRepository.create({
      ...menuData,
      menu_name,
      owner,
      branch,
    });

    const savedMenu = await this.menuRepository.save(newMenu);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Menu created successfully',
      menu: {
        menu_id: savedMenu.menu_id,
        menu_name: savedMenu.menu_name,
        description: savedMenu.description,
        price: savedMenu.price,
        image_url: savedMenu.image_url,
      },
    };
  }

  async findAll(): Promise<any[]> {
    const menus = await this.menuRepository.find({
      where: { is_delete: false },
      relations: [
        'menuIngredient',
        'sweetnessGroup',
        'sizeGroup',
        'menuTypeGroup',
      ],
    });

    return menus.map((menu) => {
      const hasRelations =
        (menu.menuIngredient && menu.menuIngredient.length > 0) ||
        (menu.sweetnessGroup !== null && menu.sweetnessGroup !== undefined) ||
        (menu.sizeGroup != null && menu.sizeGroup !== undefined) ||
        (menu.menuTypeGroup != null && menu.menuTypeGroup !== undefined);

      return hasRelations
        ? menu
        : {
          menu_id: menu.menu_id,
          menu_name: menu.menu_name,
          description: menu.description,
          image_url: menu.image_url,
          price: menu.price,
        };
    });
  }

  async findOne(menu_id: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { menu_id },
      relations: ['menuTypeGroup', 'sweetnessGroup', 'sizeGroup'],
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menu_id} not found`);
    }

    return menu;
  }

  // * อัปเดตเมนู
  async update(
    menu_id: number,
    owner_id: number,
    branch_id: number,
    updateMenuDto: Partial<Menu>,
  ): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { menu_id, owner: { owner_id }, branch: { branch_id } },
      relations: ['owner', 'branch'], // Ensure we load the related entities
    });

    if (!menu) {
      throw new Error(
        `Menu with id ${menu_id} not found for owner_id ${owner_id} and branch_id ${branch_id}`,
      );
    }

    // Assign new values
    Object.assign(menu, updateMenuDto);

    return this.menuRepository.save(menu);
  }

  // * ลบเมนู
  async remove(
    menu_id: number,
    owner_id: number,
    branch_id: number,
  ): Promise<{ message: string }> {
    const menu = await this.menuRepository.findOne({
      where: { menu_id, owner: { owner_id }, branch: { branch_id } },
      relations: ['owner', 'branch'], // Ensure relations are included
    });

    if (!menu) {
      throw new NotFoundException(
        `Menu with ID ${menu_id} not found for the given owner and branch.`,
      );
    }

    // Set soft delete
    menu.is_delete = true;
    await this.menuRepository.save(menu);

    throw new HttpException(
      { message: `Menu with ID ${menu_id} is now marked as deleted.` },
      HttpStatus.OK, // Returns HTTP 200
    );
  }

  // POST OPTION SIZE
  async createSize(type: string, createSizeDto: CreateSizeDto, ownerId: number, branchId: number) {
    if (type !== 'size') {
      throw new Error('Invalid option type');
    }

    // Step 1: Insert sizes into the `size` table
    const sizes = createSizeDto.options.map((option) => ({
      size_name: Object.keys(option)[0], 
      size_price: parseFloat(Object.values(option)[0].price), 
      owner: { owner_id: ownerId }, 
      branch: { branch_id: branchId }, 
    }));

    const savedSizes = await this.sizeRepository.save(sizes);
    console.log("SAVE SIZE:", savedSizes)

    // Step 2: Create size groups for each size
    const sizeGroups = savedSizes.map((size) => ({
      size_group_name: createSizeDto.size_group_name,
      size: size,
      owner: { owner_id: ownerId },
      branch: { branch_id: branchId },
    }));

    const savedSizeGroups = await this.sizeGroupRepository.save(sizeGroups);
    console.log("SAVE SIZE GROUP:", savedSizeGroups)

    const sizeGroup = await this.sizeGroupRepository.findOne({
      where: { size_group_name: createSizeDto.size_group_name },
    });

    console.log("size group:", sizeGroup.size_group_name);

    if (!sizeGroup) {
      throw new Error('Size Group not found');
    }

    // Step 3: Link `size_group_name` (string) to all `menu_id`
    for (const menuId of createSizeDto.menu_id) {
      await this.menuRepository.update(
        { menu_id: menuId },
        { sizeGroup: sizeGroup }  
      );
    }

    throw new HttpException(
      { message: `All size options and groups created successfully` },
      HttpStatus.OK,
    );
  }


  // * link menu for auto cut stock
  // async updateStock(
  //   menu_id: number,
  //   owner_id: number,
  //   branch_id: number,
  //   linkMenuToStockDtoList: LinkMenuToStockDto[],
  // ) {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.startTransaction();

  //   try {
  //     for (const linkMenuToStockDto of linkMenuToStockDtoList) {
  //       const { ingredient_name, unit, ingredientListForStock } = linkMenuToStockDto;

  //       // Find the menu
  //       const menu = await this.menuRepository.findOne({ where: { menu_id } });
  //       if (!menu) {
  //         throw new NotFoundException(`Menu with ID ${menu_id} not found`);
  //       }

  //       // Find the owner
  //       const owner = await this.ownerRepository.findOne({ where: { owner_id } });
  //       if (!owner) {
  //         throw new NotFoundException(`Owner with ID ${owner_id} not found`);
  //       }

  //       // Validate ingredient list items
  //       for (const property of ingredientListForStock) {
  //         const size = await this.sizeRepository.findOne({
  //           where: { size_id: property.size_id },
  //         });
  //         if (!size) {
  //           throw new NotFoundException(`Size with ID ${property.size_id} not found`);
  //         }

  //         const menuType = await this.menuTypeRepository.findOne({
  //           where: { menu_type_id: property.menu_type_id },
  //         });
  //         if (!menuType) {
  //           throw new NotFoundException(`MenuType with ID ${property.menu_type_id} not found`);
  //         }
  //       }

  //       // Find or create the ingredient
  //       let ingredient = await this.ingredientRepository.findOne({
  //         where: { ingredient_name },
  //       });

  //       if (!ingredient) {
  //         ingredient = this.ingredientRepository.create({
  //           ingredient_name,
  //           unit,
  //           owner_id: owner,
  //         });
  //         ingredient = await this.ingredientRepository.save(ingredient);
  //       } else {
  //         // Update the unit in the ingredient table if needed
  //         if (ingredient.unit !== unit) {
  //           ingredient.unit = unit;
  //           await this.ingredientRepository.save(ingredient);
  //         }
  //       }

  //       // Process the ingredient list for stock and link them
  //       for (const property of ingredientListForStock) {
  //         let menuIngredient = await this.menuIngredientRepository.findOne({
  //           where: {
  //             menu_id: menu,
  //             ingredient_id: ingredient,
  //             size_id: Equal(property.size_id),
  //             menu_type_id: Equal(property.menu_type_id),
  //           },
  //         });

  //         if (menuIngredient) {
  //           // If the ingredient already exists, update quantity_used
  //           menuIngredient.quantity_used = property.quantity_used;
  //           await this.menuIngredientRepository.save(menuIngredient);
  //         } else {
  //           // Create a new menu ingredient if it doesn't exist
  //           menuIngredient = this.menuIngredientRepository.create({
  //             menu_id: menu,
  //             ingredient_id: ingredient,
  //             size_id: { size_id: property.size_id },
  //             menu_type_id: { menu_type_id: property.menu_type_id },
  //             quantity_used: property.quantity_used,
  //           });
  //           await this.menuIngredientRepository.save(menuIngredient);
  //         }
  //       }

  //       // Create the ingredient-menu link if necessary
  //       const ingredientMenuLinkToSave = {
  //         menu_id: { menu_id: menu.menu_id },
  //         ingredient_id: { ingredient_id: ingredient.ingredient_id },
  //       };
  //       await this.ingredientMenuLinkRepository.save(ingredientMenuLinkToSave);
  //     }

  //     await queryRunner.commitTransaction();
  //     return { message: 'Link Stock successfully' };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  // EDIT ENTITY INGREDIENT_MENULINK
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

      // EDIT ENTITY
      // Find by ingredient name or create ingredient => if not have in ingredient table
      let ingredient = await this.ingredientRepository.findOne({
        where: { ingredient_name },
      });
      if (!ingredient) {
        ingredient = this.ingredientRepository.create({
          ingredient_name,
          unit,
          // owner_id: owner,
        });
        ingredient = await this.ingredientRepository.save(ingredient);
      }

      // Save the MenuIngredient records
      // Process the ingredient list for stock and link them
      for (const property of ingredientListForStock) {
        let menuIngredient = await this.menuIngredientRepository.findOne({
          where: {
            menu: Equal(menu.menu_id),
            ingredient: Equal(ingredient.ingredient_id),
            size: Equal(property.size_id),
            menu_type: Equal(property.menu_type_id),
          },
        });

        if (menuIngredient) {
          // If the ingredient already exists, update quantity_used
          menuIngredient.quantity_used = property.quantity_used;
          await this.menuIngredientRepository.save(menuIngredient);
        } else {
          // Create a new menu ingredient if it doesn't exist
          menuIngredient = this.menuIngredientRepository.create({
            menu: menu,
            ingredient: ingredient,
            size: { size_id: property.size_id },
            menu_type: { menu_type_id: property.menu_type_id },
            quantity_used: property.quantity_used,
          });
          await this.menuIngredientRepository.save(menuIngredient);
        }
        console.log('menuIngredient:', menuIngredient);
      }

      console.log('ingredientListForStock:', ingredientListForStock);

      // link menu id and ingredient id in ingredient menu link
      const ingredientMenuLinkToSave = {
        menu_id: { menu_id: menu.menu_id },
        ingredient_id: { ingredient_id: ingredient.ingredient_id },
      };

      console.log('ingredientMenuLinkToSave:', ingredientMenuLinkToSave);

      // await this.ingredientMenuLinkRepository.save(ingredientMenuLinkToSave);
    }

    return { message: 'Link Stock successfully' };
  }

  async updateOption(type: string, optionId: number, updateOptionDto: any) {
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
        repository: this.sweetnessLevelRepository,
        optionKey: 'level_name',
        idKey: 'sweetness_id',
        relation: 'sweetnessLevels',
      },
    };

    if (!optionConfig[type]) {
      throw new NotFoundException(`Invalid option type: ${type}`);
    }

    const { repository, optionKey, idKey, priceKey } = optionConfig[type];

    // หา option เดิมจาก ID ที่ส่งมา
    const existingOption = await repository.findOne({
      where: { [idKey]: optionId },
      relations: ['menu'],
    });

    if (!existingOption) {
      throw new NotFoundException(`Option with ID ${optionId} not found`);
    }

    const oldName = existingOption[optionKey];

    // สำหรับ request ในรูปแบบใหม่
    if (updateOptionDto.options && updateOptionDto.menu_id) {
      for (const menuId of updateOptionDto.menu_id) {
        for (const option of updateOptionDto.options) {
          const optionName = Object.keys(option)[0];
          const optionDetails = option[optionName];

          // ค้นหา option ที่มีชื่อเดิม (oldName) ใน menu ที่ระบุ
          const existingMenuOption = await repository.findOne({
            where: {
              [optionKey]: oldName,
              menu: { menu_id: menuId },
            },
          });

          if (existingMenuOption) {
            // ถ้าเจอให้อัพเดตข้อมูล
            existingMenuOption[optionKey] = optionName;
            if (priceKey) {
              existingMenuOption[priceKey] = parseFloat(optionDetails.price);
            }
            if (optionDetails.unit !== undefined) {
              existingMenuOption.unit = optionDetails.unit;
            }
            await repository.save(existingMenuOption);
          } else {
            // ถ้าไม่เจอให้สร้างใหม่
            const newOption = repository.create({
              [optionKey]: optionName,
              ...(priceKey
                ? { [priceKey]: parseFloat(optionDetails.price) }
                : {}),
              ...(optionDetails.unit !== undefined
                ? { unit: optionDetails.unit }
                : {}),
              menu: { menu_id: menuId },
            });
            await repository.save(newOption);
          }
        }
      }

      return {
        message: `${type} options updated successfully`,
        oldName,
        updatedMenuIds: updateOptionDto.menu_id,
      };
    }

    // สำหรับ request ในรูปแบบเดิม (backward compatibility)
    if (updateOptionDto.name) {
      existingOption[optionKey] = updateOptionDto.name;
    }
    if (priceKey && updateOptionDto[priceKey] !== undefined) {
      existingOption[priceKey] = parseFloat(updateOptionDto[priceKey]);
    }

    await repository.save(existingOption);

    if (updateOptionDto.menu_id) {
      for (const menuId of updateOptionDto.menu_id) {
        const relatedOption = await repository.findOne({
          where: {
            [optionKey]: oldName,
            menu: { menu_id: menuId },
          },
        });

        if (relatedOption) {
          relatedOption[optionKey] = updateOptionDto.name;
          if (priceKey && updateOptionDto[priceKey] !== undefined) {
            relatedOption[priceKey] = parseFloat(updateOptionDto[priceKey]);
          }
          await repository.save(relatedOption);
        } else {
          const newOption = repository.create({
            [optionKey]: updateOptionDto.name,
            ...(priceKey
              ? { [priceKey]: parseFloat(updateOptionDto[priceKey]) }
              : {}),
            menu: { menu_id: menuId },
          });

          await repository.save(newOption);
        }
      }
    }

    return {
      message: `${type} updated successfully`,
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
        repository = this.sweetnessLevelRepository;
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
  // EDIT ENTITY
  async findOptionById(type: string, menuId: number) {
    switch (type) {
      // edit entity
      // case 'add-ons':
      //   return this.addOnRepository.find({ where: { menu: { menu_id: menuId } } });
      // case 'size':
      //   return this.sizeRepository.find({ where: { menu: { menu_id: menuId } } });
      // edit entity
      // case 'sweetness':
      //   return this.sweetnessRepository.find({ where: { menu: { menu_id: menuId } } });
      // case 'menu-type':
      // return this.menuTypeRepository.find({ where: { menu: { menu_id: menuId } } });
      default:
        throw new Error('Invalid option type');
    }
  }
}
