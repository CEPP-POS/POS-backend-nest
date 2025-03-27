import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Menu } from '../../entities/menu.entity';
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
import { CreateMenuTypeGroupDto } from './dto/menu-type/create-menu-type-group.dto';
import { MenuTypeGroup } from 'src/entities/menu-type-group.entity';
import { UpdateMenuTypeGroupDto } from './dto/menu-type/update-menu-type-group.dto';
import { SweetnessGroup } from 'src/entities/sweetness-group.entity';
import { SizeGroup } from 'src/entities/size-group.entity';
import { CreateSizeDto } from './dto/create-option/create-size.dto';
import { CreateAddOnDto } from './dto/create-option/create-add-ons.dto';
import { CreateSweetnessDto } from './dto/create-option/create-sweetness-dto';
import { UpdateSweetnessDto } from './dto/update-option/update-sweetness-dto';
import { UpdateSizeDto } from './dto/update-option/update-size.dto';
import { UpdateAddOnDto } from './dto/update-option/update-add-on.dto';
import { v4 as uuidv4 } from 'uuid';

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

    @InjectRepository(MenuTypeGroup)
    private readonly menuTypeGroupRepository: Repository<MenuTypeGroup>,

    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,

    @InjectRepository(SizeGroup)
    private readonly sizeGroupRepository: Repository<SizeGroup>,

    @InjectRepository(SweetnessLevel)
    private readonly sweetnessLevelRepository: Repository<SweetnessLevel>,

    @InjectRepository(SweetnessGroup)
    private sweetnessGroupRepository: Repository<SweetnessGroup>,

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
  ) {}

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

    // Check if Owner exists
    const owner = await this.ownerRepository.findOne({ where: { owner_id } });
    if (!owner) {
      throw new NotFoundException(`Owner with ID ${owner_id} not found`);
    }

    // Check if Branch exists
    const branch = await this.branchRepository.findOne({
      where: { branch_id },
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branch_id} not found`);
    }

    // Check for duplicate menu name within owner and branch scope
    const duplicateMenu = await this.menuRepository.findOne({
      where: {
        menu_name,
        owner: { owner_id },
        branch: { branch_id },
      },
    });

    if (duplicateMenu) {
      throw new ConflictException(
        `Menu with name "${menu_name}" already exists in this branch`,
      );
    }

    // Create new menu with generated UUID
    const newMenu = this.menuRepository.create({
      menu_id: menuData.menu_id || uuidv4(),
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

  async findAll(owner_id: string, branch_id: string): Promise<any[]> {
    const menus = await this.menuRepository.find({
      where: {
        is_delete: false,
        owner: { owner_id },
        branch: { branch_id },
      },
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

  async findOne(menu_id: string): Promise<Menu> {
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
    menu_id: string,
    owner_id: string,
    branch_id: string,
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
    menu_id: string,
    owner_id: string,
    branch_id: string,
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

  // POST SWEETNESS
  async createSweetness(
    type: string,
    createSweetnessDto: CreateSweetnessDto,
    ownerId: string,
    branchId: string,
  ) {
    if (type !== 'sweetness') {
      throw new Error('Invalid option type');
    }

    // Step 1: Insert sweetness levels
    const sweetnessLevels = createSweetnessDto.options.map((option) => ({
      sweetness_id: createSweetnessDto.sweetness_id || uuidv4(),
      level_name: option,
      owner: { owner_id: ownerId },
      branch: { branch_id: branchId },
    }));
    sweetnessLevels.forEach((sweetness) => {
      console.log('Owner ID:', sweetness.owner.owner_id);
      console.log('Branch ID:', sweetness.branch.branch_id);
    });
    const savedSweetnessLevels =
      await this.sweetnessLevelRepository.save(sweetnessLevels);
    console.log(savedSweetnessLevels);
    // Step 2: Create sweetness groups
    const sweetnessGroups = savedSweetnessLevels.map((sweetness) => ({
      sweetness_group_id: createSweetnessDto.sweetness_group_id || uuidv4(),
      sweetness_group_name: createSweetnessDto.sweetness_group_name,
      sweetnessLevel: sweetness, // Correct reference
      owner: { owner_id: ownerId },
      branch: { branch_id: branchId },
    }));

    // const savedSweetnessGroups =
    await this.sweetnessGroupRepository.save(sweetnessGroups);

    // Ensure the sweetness group exists
    const sweetnessGroup = await this.sweetnessGroupRepository.findOne({
      where: { sweetness_group_name: createSweetnessDto.sweetness_group_name },
    });

    if (!sweetnessGroup) {
      throw new Error('Sweetness Group not found');
    }

    // Step 3: Link sweetness group to menu items
    for (const menuId of createSweetnessDto.menu_id) {
      await this.menuRepository.update(
        { menu_id: menuId },
        { sweetnessGroup: sweetnessGroup },
      );
    }

    throw new HttpException(
      { message: `All sweetness options and groups created successfully` },
      HttpStatus.OK,
    );
  }

  async updateSweetness(
    type: string,
    updateSweetnessDto: UpdateSweetnessDto,
    ownerId: string,
    branchId: string,
  ) {
    try {
      if (type !== 'sweetness') {
        throw new Error('Invalid option type');
      }

      // 1. หา sweetness groups ที่มีชื่อเดิม
      const existingSweetnessGroups = await this.sweetnessGroupRepository.find({
        where: {
          sweetness_group_name: updateSweetnessDto.old_sweetness_group_name,
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
        relations: ['sweetnessLevel'],
      });

      if (existingSweetnessGroups.length === 0) {
        throw new HttpException(
          { message: 'Sweetness group not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      // 2. อัพเดทชื่อกลุ่มถ้ามีการเปลี่ยนแปลง
      if (
        updateSweetnessDto.old_sweetness_group_name !==
        updateSweetnessDto.new_sweetness_group_name
      ) {
        await this.sweetnessGroupRepository.update(
          {
            sweetness_group_name: updateSweetnessDto.old_sweetness_group_name,
            owner: { owner_id: ownerId },
            branch: { branch_id: branchId },
          },
          { sweetness_group_name: updateSweetnessDto.new_sweetness_group_name },
        );
      }

      // แยกตัวเลือกเป็นที่มี ID และไม่มี ID
      const existingOptions = updateSweetnessDto.options.filter(
        (opt) => opt.sweetness_id !== null && opt.sweetness_id !== undefined,
      );
      const newOptions = updateSweetnessDto.options.filter(
        (opt) => opt.sweetness_id === null || opt.sweetness_id === undefined,
      );

      // รวบรวม sweetness IDs ที่ยังคงอยู่
      const keepSweetnessIds = existingOptions.map((opt) => opt.sweetness_id);

      // หา sweetness levels ที่จะถูกลบ
      const existingSweetnessLevels = existingSweetnessGroups.map(
        (group) => group.sweetnessLevel.sweetness_id,
      );
      const sweetnessIdsToDelete = existingSweetnessLevels.filter(
        (id) => !keepSweetnessIds.includes(id),
      );

      // จัดการกับ sweetness levels ที่จะถูกลบ
      if (sweetnessIdsToDelete.length > 0) {
        await this.sweetnessLevelRepository.update(
          { sweetness_id: In(sweetnessIdsToDelete) },
          { is_delete: true },
        );

        // หาเมนูที่ใช้ sweetness levels ที่จะถูกลบและอัพเดท
        const affectedMenus = await this.menuRepository.find({
          where: {
            sweetnessGroup: {
              sweetness_group_name: updateSweetnessDto.old_sweetness_group_name,
              sweetnessLevel: { sweetness_id: In(sweetnessIdsToDelete) },
            },
          },
          relations: ['sweetnessGroup'],
        });

        for (const menu of affectedMenus) {
          const alternativeSweetnessGroup =
            await this.sweetnessGroupRepository.findOne({
              where: {
                sweetness_group_name:
                  updateSweetnessDto.new_sweetness_group_name,
                sweetnessLevel: {
                  sweetness_id: In(keepSweetnessIds),
                  is_delete: false,
                },
              },
            });

          menu.sweetnessGroup = alternativeSweetnessGroup || null;
          await this.menuRepository.save(menu);
        }

        await this.sweetnessGroupRepository.delete({
          sweetnessLevel: { sweetness_id: In(sweetnessIdsToDelete) },
        });
      }

      // อัพเดทชื่อของ sweetness levels ที่มีอยู่
      for (const option of existingOptions) {
        await this.sweetnessLevelRepository.update(
          { sweetness_id: option.sweetness_id },
          { level_name: option.level_name },
        );
      }

      // สร้าง sweetness levels ใหม่และ link กับ group
      for (const option of newOptions) {
        // สร้าง sweetness level ใหม่
        const newLevel = await this.sweetnessLevelRepository.save({
          sweetness_id: uuidv4(),
          level_name: option.level_name,
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        });

        // สร้าง sweetness group ใหม่และ link กับ level
        await this.sweetnessGroupRepository.save({
          sweetness_group_id: uuidv4(),
          sweetness_group_name: updateSweetnessDto.new_sweetness_group_name,
          sweetnessLevel: newLevel,
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        });
      }

      // อัพเดทความสัมพันธ์กับเมนู
      const menusToUpdate = await this.menuRepository.find({
        where: {
          menu_id: In(updateSweetnessDto.menu_id),
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
        relations: ['sweetnessGroup'],
      });

      const sweetnessGroup = await this.sweetnessGroupRepository.findOne({
        where: {
          sweetness_group_name: updateSweetnessDto.new_sweetness_group_name,
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
      });

      if (!sweetnessGroup) {
        throw new NotFoundException('Sweetness group not found');
      }

      for (const menu of menusToUpdate) {
        menu.sweetnessGroup = sweetnessGroup;
        await this.menuRepository.save(menu);
      }

      return {
        message: 'Sweetness options and groups updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // POST OPTION SIZE
  async createSize(
    type: string,
    createSizeDto: CreateSizeDto,
    ownerId: string,
    branchId: string,
  ) {
    if (type !== 'size') {
      throw new Error('Invalid option type');
    }

    // Step 1: Insert sizes name and size price into the size table
    const sizes = createSizeDto.options.map((option) => ({
      size_id: option.size_id || uuidv4(),
      size_name: Object.keys(option)[0],
      size_price: parseFloat(Object.values(option)[0].price),
      owner: { owner_id: ownerId },
      branch: { branch_id: branchId },
    }));

    const savedSizes = await this.sizeRepository.save(sizes);
    console.log('SAVE SIZE:', savedSizes);

    // Step 2: Create size groups for each size
    const sizeGroups = savedSizes.map((size) => ({
      size_group_id: createSizeDto.size_group_id || uuidv4(),
      size_group_name: createSizeDto.size_group_name,
      size: size,
      owner: { owner_id: ownerId },
      branch: { branch_id: branchId },
    }));

    const savedSizeGroups = await this.sizeGroupRepository.save(sizeGroups);
    console.log('SAVE SIZE GROUP:', savedSizeGroups);

    const sizeGroup = await this.sizeGroupRepository.findOne({
      where: { size_group_name: createSizeDto.size_group_name },
    });

    console.log('size group:', sizeGroup.size_group_name);

    if (!sizeGroup) {
      throw new Error('Size Group not found');
    }

    // Step 3: Link size_group_id and name to all menu_id
    for (const menuId of createSizeDto.menu_id) {
      await this.menuRepository.update(
        { menu_id: menuId },
        { sizeGroup: sizeGroup },
      );
    }

    throw new HttpException(
      { message: `All size options and groups created successfully` },
      HttpStatus.OK,
    );
  }

  //POST ADD ON OPTION
  async createAddOn(
    type: string,
    createAddOnDto: CreateAddOnDto,
    ownerId: string,
    branchId: string,
  ) {
    const { options, menu_id, is_required, is_multipled } = createAddOnDto;

    //save name in table ingredient
    const ingredientIds = [];
    for (const option of options) {
      const [ingredientName, ingredientData] = Object.entries(option)[0];

      let ingredient = await this.ingredientRepository.findOne({
        where: {
          ingredient_name: ingredientName,
          branch: { branch_id: branchId },
          owner: { owner_id: ownerId },
        },
      });

      if (!ingredient) {
        ingredient = this.ingredientRepository.create({
          ingredient_id: ingredientData.ingredient_id || uuidv4(),
          ingredient_name: ingredientName,
          unit: ingredientData.unit,
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        });
        ingredient = await this.ingredientRepository.save(ingredient);
      }

      ingredientIds.push(ingredient.ingredient_id);

      // save ingredient_id in table add on
      const addOn = this.addOnRepository.create({
        add_on_id: ingredientData.add_on_id || uuidv4(),
        ingredient: ingredient,
        add_on_price: parseFloat(ingredientData.price),
        is_required: is_required,
        is_multipled: is_multipled,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      });
      await this.addOnRepository.save(addOn);

      // Save menu id and ingredient id, quantity in table menu_ingredient
      for (const menuId of menu_id) {
        // Check if the menuIngredient already exists to avoid duplicates
        const existingMenuIngredient =
          await this.menuIngredientRepository.findOne({
            where: {
              menu: { menu_id: menuId },
              ingredient: { ingredient_id: ingredient.ingredient_id },
              owner: { owner_id: ownerId },
              branch: { branch_id: branchId },
            },
          });

        if (!existingMenuIngredient) {
          // Log ingredientId for debugging
          console.log(`Processing ingredientId: ${ingredient.ingredient_id}`);

          // Log the result of ingredientData lookup
          console.log('Found ingredientData:', ingredientData);

          if (!ingredientData) {
            throw new Error(
              `Ingredient data not found for ingredient: ${ingredientName}`,
            );
          }

          const menuIngredient = this.menuIngredientRepository.create({
            menu_ingredient_id: ingredientData.menu_ingredient_id || uuidv4(),
            menu: { menu_id: menuId },
            ingredient: { ingredient_id: ingredient.ingredient_id },
            is_addon: true,
            quantity_used: parseFloat(ingredientData.quantity),
            owner: { owner_id: ownerId },
            branch: { branch_id: branchId },
          });
          await this.menuIngredientRepository.save(menuIngredient);
        } else {
          console.log(
            `MenuIngredient for menu_id ${menuId} and ingredient_id ${ingredient.ingredient_id} already exists.`,
          );
        }
      }
    }
  }

  async deleteSizeGroup(
    sizeGroupName: string,
    ownerId: string,
    branchId: string,
  ) {
    // find all size group name
    const sizeGroups = await this.sizeGroupRepository.find({
      where: {
        size_group_name: sizeGroupName,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['size', 'menu'], // Include related sizes and menus
    });

    if (!sizeGroups.length) {
      throw new Error(`Size group '${sizeGroupName}' not found.`);
    }

    // find size id by size group name to change status is_delete
    const sizesToUpdate = sizeGroups.map((group) => group.size);

    if (sizesToUpdate.length) {
      await this.sizeRepository.update(
        { size_id: In(sizesToUpdate.map((size) => size.size_id)) },
        { is_delete: true },
      );
    }

    // remove size group references in the menu table
    await this.menuRepository.update(
      { sizeGroup: In(sizeGroups.map((group) => group.size_group_id)) },
      { sizeGroup: null },
    );

    // delete all size group name in table size group
    await this.sizeGroupRepository.delete({ size_group_name: sizeGroupName });

    return {
      message: `Size group '${sizeGroupName}' deleted and related sizes marked as deleted.`,
    };
  }

  // EDIT ENTITY INGREDIENT_MENULINK
  async linkIngredientToStock(
    menu_id: string,
    owner_id: string,
    branch_id: string,
    linkMenuToStockDtoList: LinkMenuToStockDto[],
  ) {
    // ตรวจสอบว่ามี menu, owner, branch อยู่จริง
    const menu = await this.menuRepository.findOne({ where: { menu_id } });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menu_id} not found`);
    }

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

    for (const linkMenuToStockDto of linkMenuToStockDtoList) {
      const { ingredient_name, unit, ingredientListForStock } =
        linkMenuToStockDto;

      // ค้นหา ingredient จากชื่อ
      let ingredient = await this.ingredientRepository.findOne({
        where: {
          ingredient_name,
          owner: { owner_id },
          branch: { branch_id },
        },
      });

      // ถ้าไม่มี ingredient ให้สร้างใหม่
      if (!ingredient) {
        ingredient = this.ingredientRepository.create({
          ingredient_id: linkMenuToStockDto.ingredient_id || uuidv4(),
          ingredient_name,
          unit,
          owner,
          branch,
        });
        ingredient = await this.ingredientRepository.save(ingredient);
      }

      // วนลูปจัดการแต่ละ size และ menu type
      for (const stockItem of ingredientListForStock) {
        const { size_id, menu_type_id, quantity_used } = stockItem;

        // ตรวจสอบว่ามี size และ menu type อยู่จริง
        const size = await this.sizeRepository.findOne({
          where: { size_id, owner: { owner_id }, branch: { branch_id } },
        });
        if (!size) {
          throw new NotFoundException(`Size with ID ${size_id} not found`);
        }

        const menuType = await this.menuTypeRepository.findOne({
          where: { menu_type_id, owner: { owner_id }, branch: { branch_id } },
        });
        if (!menuType) {
          throw new NotFoundException(
            `MenuType with ID ${menu_type_id} not found`,
          );
        }

        // ค้นหา menu_ingredient ที่มีอยู่
        let menuIngredient = await this.menuIngredientRepository.findOne({
          where: {
            menu: { menu_id },
            ingredient: { ingredient_id: ingredient.ingredient_id },
            size: { size_id },
            menu_type: { menu_type_id },
            owner: { owner_id },
            branch: { branch_id },
          },
        });

        if (menuIngredient) {
          // ถ้ามีอยู่แล้วให้อัพเดท quantity_used
          menuIngredient.quantity_used = quantity_used;
          await this.menuIngredientRepository.save(menuIngredient);
        } else {
          // ถ้าไม่มีให้สร้างใหม่
          menuIngredient = this.menuIngredientRepository.create({
            menu_ingredient_id: stockItem.menu_ingredient_id || uuidv4(),
            menu,
            ingredient,
            size,
            menu_type: menuType,
            quantity_used,
            is_addon: false,
            owner,
            branch,
          });
          await this.menuIngredientRepository.save(menuIngredient);
        }
      }
    }

    return {
      message: 'Link Stock successfully',
      statusCode: HttpStatus.OK,
    };
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

  async createMenuTypeGroup(
    dto: CreateMenuTypeGroupDto,
    owner_id: string,
    branch_id: string,
  ): Promise<any> {
    try {
      if (!dto.options || dto.options.length === 0) {
        throw new Error('Options cannot be empty');
      }

      const owner = await this.ownerRepository.findOne({ where: { owner_id } });
      if (!owner) throw new NotFoundException('Owner not found');

      const branch = await this.branchRepository.findOne({
        where: { branch_id },
      });
      if (!branch) throw new NotFoundException('Branch not found');

      const menuTypes = dto.options.map((option) => {
        const typeName = Object.keys(option)[0];
        return {
          menu_type_id: option.menu_type_id || uuidv4(),
          type_name: typeName,
          price_difference: parseFloat(Object.values(option)[0]),
          is_delete: false,
          owner,
          branch,
        };
      });

      const savedMenuTypes = await this.menuTypeRepository.save(menuTypes);

      // Create menu type group entries for each menu type
      const menuTypeGroupEntries = savedMenuTypes.map((menuType) => ({
        menu_type_group_id: dto.menu_type_group_id || uuidv4(),
        menu_type_group_name: dto.menu_type_group_name,
        menuType: menuType,
        owner,
        branch,
      }));

      // Save all menu type group entries
      const savedMenuTypeGroups =
        await this.menuTypeGroupRepository.save(menuTypeGroupEntries);

      // Link menus to the menu type group - using the first menu type group since they share the same name
      const menuTypeGroup = savedMenuTypeGroups[0];

      // Update menus with the menu type group reference
      for (const menuId of dto.menu_id) {
        await this.menuRepository
          .createQueryBuilder()
          .update(Menu)
          .set({ menuTypeGroup: menuTypeGroup })
          .where('menu_id = :menuId', { menuId })
          .andWhere('owner.owner_id = :ownerId', { ownerId: owner_id })
          .andWhere('branch.branch_id = :branchId', { branchId: branch_id })
          .execute();
      }

      return {
        message: 'Menu Type Group created successfully',
        menu_type_group_name: dto.menu_type_group_name,
        menu_types: savedMenuTypes,
        linked_menus: dto.menu_id,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create menu type group',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteMenuTypeGroup(
    menuTypeGroupName: string,
    ownerId: string,
    branchId: string,
  ): Promise<any> {
    const menuTypeGroups = await this.menuTypeGroupRepository.find({
      where: {
        menu_type_group_name: menuTypeGroupName,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['menuType', 'owner', 'branch'],
    });

    if (!menuTypeGroups.length) {
      throw new NotFoundException(
        `MenuTypeGroup '${menuTypeGroupName}' not found.`,
      );
    }

    const menuTypesToUpdate = menuTypeGroups.flatMap((group) => group.menuType);
    if (menuTypesToUpdate.length) {
      await this.menuTypeRepository.update(
        {
          menu_type_id: In(menuTypesToUpdate.map((type) => type.menu_type_id)),
        },
        { is_delete: true },
      );
    }

    await this.menuRepository.update(
      {
        menuTypeGroup: In(
          menuTypeGroups.map((group) => group.menu_type_group_id),
        ),
      },
      { menuTypeGroup: null },
    );

    // ✅ Step 4: ลบ `MenuTypeGroup`
    await this.menuTypeGroupRepository.delete({
      menu_type_group_name: menuTypeGroupName,
    });

    return {
      message: `MenuTypeGroup '${menuTypeGroupName}' deleted and related menu types marked as deleted.`,
    };
  }

  async updateMenuTypeGroup(
    owner_id: string,
    branch_id: string,
    updateMenuTypeGroupDto: UpdateMenuTypeGroupDto,
  ): Promise<any> {
    try {
      const {
        old_menu_type_group_name,
        new_menu_type_group_name,
        options,
        menu_id,
      } = updateMenuTypeGroupDto;

      const existingMenuTypeGroups = await this.menuTypeGroupRepository.find({
        where: {
          menu_type_group_name: old_menu_type_group_name,
          owner: { owner_id },
          branch: { branch_id },
        },
        relations: ['menuType'],
      });

      if (existingMenuTypeGroups.length === 0) {
        throw new NotFoundException('Menu Type Group not found');
      }

      if (old_menu_type_group_name !== new_menu_type_group_name) {
        await this.menuTypeGroupRepository.update(
          {
            menu_type_group_name: old_menu_type_group_name,
            owner: { owner_id },
            branch: { branch_id },
          },
          { menu_type_group_name: new_menu_type_group_name },
        );
      }

      const existingMenuTypeIds = existingMenuTypeGroups.map((group) =>
        group.menuType.menu_type_id.toString(),
      );

      const keepMenuTypeIds = options
        .filter((opt) => opt.menu_type_id && opt.menu_type_id !== null)
        .map((opt) => opt.menu_type_id);

      for (const option of options) {
        if (option.menu_type_id && option.menu_type_id !== null) {
          await this.menuTypeRepository.update(
            { menu_type_id: option.menu_type_id },
            {
              type_name: option.type_name,
              price_difference: parseFloat(String(option.price_difference)),
              is_delete: false,
            },
          );
        }
      }

      for (const existingMenuTypeId of existingMenuTypeIds) {
        if (!keepMenuTypeIds.includes(existingMenuTypeId)) {
          const menuTypeIdNum = existingMenuTypeId;

          await this.menuTypeRepository.update(
            { menu_type_id: menuTypeIdNum },
            { is_delete: true },
          );

          const affectedMenuTypeGroups =
            await this.menuTypeGroupRepository.find({
              where: {
                menuType: { menu_type_id: menuTypeIdNum },
                owner: { owner_id },
                branch: { branch_id },
              },
              relations: ['menuType'],
            });

          for (const menuTypeGroup of affectedMenuTypeGroups) {
            const menusUsingGroup = await this.menuRepository.find({
              where: {
                menuTypeGroup: {
                  menu_type_group_id: menuTypeGroup.menu_type_group_id,
                },
              },
            });

            if (menusUsingGroup.length > 0) {
              const alternativeMenuTypeGroup =
                await this.menuTypeGroupRepository.findOne({
                  where: {
                    menu_type_group_name: menuTypeGroup.menu_type_group_name,
                    owner: { owner_id },
                    branch: { branch_id },
                    menuType: { is_delete: false },
                    menu_type_group_id: Not(menuTypeGroup.menu_type_group_id),
                  },
                });

              await this.menuRepository.update(
                { menu_id: In(menusUsingGroup.map((m) => m.menu_id)) },
                { menuTypeGroup: alternativeMenuTypeGroup || null },
              );
            }

            await this.menuTypeGroupRepository.delete(
              menuTypeGroup.menu_type_group_id,
            );
          }
        }
      }

      const newMenuTypeOptions = options.filter(
        (opt) => opt.menu_type_id === null,
      );
      for (const newOption of newMenuTypeOptions) {
        const newMenuType = await this.menuTypeRepository.save({
          menu_type_id: uuidv4(),
          type_name: newOption.type_name,
          price_difference: parseFloat(String(newOption.price_difference)),
          owner: { owner_id },
          branch: { branch_id },
        });

        const existingLink = await this.menuTypeGroupRepository.findOne({
          where: {
            menu_type_group_name: new_menu_type_group_name,
            menuType: { menu_type_id: newMenuType.menu_type_id },
          },
        });

        if (!existingLink) {
          await this.menuTypeGroupRepository.save({
            menu_type_group_id: uuidv4(),
            menu_type_group_name: new_menu_type_group_name,
            menuType: newMenuType,
            owner: { owner_id },
            branch: { branch_id },
          });
        }
      }

      const menuTypeGroup = await this.menuTypeGroupRepository.findOne({
        where: {
          menu_type_group_name: new_menu_type_group_name,
          owner: { owner_id },
          branch: { branch_id },
        },
      });

      if (!menuTypeGroup) {
        throw new NotFoundException(
          `Menu Type Group "${new_menu_type_group_name}" not found`,
        );
      }

      await this.menuRepository.update(
        { menu_id: In(menu_id) },
        { menuTypeGroup: menuTypeGroup },
      );

      await this.menuRepository.update(
        {
          menu_id: Not(In(menu_id)),
          menuTypeGroup: menuTypeGroup,
        },
        { menuTypeGroup: null },
      );

      return {
        message: 'Menu Type Group updated successfully',
        HttpStatus: HttpStatus.OK,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message || 'Something went wrong.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOptionById(type: string, menuId: string) {
    const menu = await this.menuRepository.findOne({
      where: { menu_id: menuId },
      relations: ['menuTypeGroup', 'sweetnessGroup', 'sizeGroup'],
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menuId} not found`);
    }

    switch (type) {
      case 'menu-type':
        return menu.menuTypeGroup;
      case 'sweetness':
        return menu.sweetnessGroup;
      case 'size':
        return menu.sizeGroup;
      case 'add-ons':
        const addOns = await this.menuIngredientRepository.find({
          where: {
            menu: { menu_id: menuId },
            is_addon: true,
          },
          relations: ['ingredient'],
        });
        return addOns;
      default:
        throw new Error('Invalid option type');
    }
  }

  async updateSize(
    owner_id: string,
    branch_id: string,
    updateSizeDto: UpdateSizeDto,
  ) {
    try {
      const { old_size_group_name, new_size_group_name, options, menu_id } =
        updateSizeDto;

      // 1. Get existing size groups and their sizes
      const existingSizeGroups = await this.sizeGroupRepository.find({
        where: {
          size_group_name: old_size_group_name,
          owner: { owner_id },
          branch: { branch_id },
        },
        relations: ['size'],
      });

      if (existingSizeGroups.length === 0) {
        throw new NotFoundException('Size group not found');
      }

      // 2. Handle group name change if needed
      if (old_size_group_name !== new_size_group_name) {
        await this.sizeGroupRepository.update(
          {
            size_group_name: old_size_group_name,
            owner: { owner_id },
            branch: { branch_id },
          },
          { size_group_name: new_size_group_name },
        );
      }

      // 3. Process size updates and deletions
      const existingSizeIds = existingSizeGroups.map((group) =>
        group.size.size_id.toString(),
      );
      const keepSizeIds = options
        .filter((opt) => opt.size_id !== null)
        .map((opt) => opt.size_id);

      // Update existing sizes
      for (const option of options) {
        if (option.size_id !== null) {
          await this.sizeRepository.update(
            { size_id: option.size_id },
            {
              size_name: option.size_name,
              size_price: parseFloat(String(option.price)),
              is_delete: false,
            },
          );
        }
      }

      // Handle deleted sizes
      for (const existingSizeId of existingSizeIds) {
        if (!keepSizeIds.includes(existingSizeId)) {
          const sizeIdNum = existingSizeId;

          // 1. Mark size as deleted
          await this.sizeRepository.update(
            { size_id: sizeIdNum },
            { is_delete: true },
          );

          // 2. Find all size groups using this size
          const affectedSizeGroups = await this.sizeGroupRepository.find({
            where: {
              size: { size_id: sizeIdNum },
              owner: { owner_id },
              branch: { branch_id },
            },
            relations: ['size'],
          });

          for (const sizeGroup of affectedSizeGroups) {
            // Find menus using this size group
            const menusUsingGroup = await this.menuRepository.find({
              where: { sizeGroup: { size_group_id: sizeGroup.size_group_id } },
            });

            if (menusUsingGroup.length > 0) {
              // Try to find another size group in the same name group that has non-deleted sizes
              const alternativeSizeGroup =
                await this.sizeGroupRepository.findOne({
                  where: {
                    size_group_name: sizeGroup.size_group_name,
                    owner: { owner_id },
                    branch: { branch_id },
                    size: { is_delete: false },
                    size_group_id: Not(sizeGroup.size_group_id),
                  },
                });

              // Update menus to use alternative size group or null
              await this.menuRepository.update(
                { menu_id: In(menusUsingGroup.map((m) => m.menu_id)) },
                { sizeGroup: alternativeSizeGroup || null },
              );
            }

            // Remove this size group entry
            await this.sizeGroupRepository.delete(sizeGroup.size_group_id);
          }
        }
      }

      // 4. Add new sizes
      const newSizeOptions = options.filter((opt) => opt.size_id === null);
      for (const newOption of newSizeOptions) {
        // Create new size
        const newSize = await this.sizeRepository.save({
          size_id: uuidv4(),
          size_name: newOption.size_name,
          size_price: parseFloat(String(newOption.price)),
          owner: { owner_id },
          branch: { branch_id },
        });

        // Link to size group if not already linked
        const existingLink = await this.sizeGroupRepository.findOne({
          where: {
            size_group_name: new_size_group_name,
            size: { size_id: newSize.size_id },
          },
        });

        if (!existingLink) {
          await this.sizeGroupRepository.save({
            size_group_id: uuidv4(),
            size_group_name: new_size_group_name,
            size: newSize,
            owner: { owner_id },
            branch: { branch_id },
          });
        }
      }

      // 5. Update menu relationships
      const sizeGroup = await this.sizeGroupRepository.findOne({
        where: {
          size_group_name: new_size_group_name,
          owner: { owner_id },
          branch: { branch_id },
        },
      });

      if (!sizeGroup) {
        throw new NotFoundException(
          `Size group "${new_size_group_name}" not found`,
        );
      }

      // Update menus to use this size group
      await this.menuRepository.update(
        { menu_id: In(menu_id) },
        { sizeGroup: sizeGroup },
      );

      // Clear size group for menus that shouldn't use it anymore
      await this.menuRepository.update(
        {
          menu_id: Not(In(menu_id)),
          sizeGroup: sizeGroup,
        },
        { sizeGroup: null },
      );

      return { message: 'Size options updated successfully' };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteAllAddOns(ownerId: string, branchId: string) {
    try {
      // 1. Find all add-ons for this owner/branch
      const addOns = await this.addOnRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
        relations: ['ingredient'],
      });

      if (addOns.length === 0) {
        return { message: 'No add-ons found' };
      }

      // 2. Get unique ingredient IDs
      const ingredientIds = [
        ...new Set(
          addOns
            .filter((addOn) => addOn.ingredient) // Filter out any null ingredients
            .map((addOn) => addOn.ingredient.ingredient_id),
        ),
      ];

      // 3. Mark all related ingredients as deleted
      if (ingredientIds.length > 0) {
        await this.ingredientRepository.update(
          {
            ingredient_id: In(ingredientIds),
            owner: { owner_id: ownerId },
            branch: { branch_id: branchId },
          },
          { is_delete: true },
        );
      }

      // 4. Delete the add-ons
      await this.addOnRepository.delete({
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      });

      return {
        message:
          'Successfully deleted all add-ons and marked ingredients as deleted',
        deletedAddOnsCount: addOns.length,
        deletedIngredientsCount: ingredientIds.length,
      };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateAddOn(
    owner_id: string,
    branch_id: string,
    updateAddOnDto: UpdateAddOnDto,
  ) {
    try {
      const { options, menu_id, is_require, is_multiple } = updateAddOnDto;

      // Get all existing menu_ingredients for these add-ons
      const existingMenuIngredients = await this.menuIngredientRepository.find({
        where: {
          owner: { owner_id },
          branch: { branch_id },
          is_addon: true,
        },
        relations: ['menu', 'ingredient'],
      });

      // Find menu IDs that were removed
      const existingMenuIds = [
        ...new Set(existingMenuIngredients.map((mi) => mi.menu.menu_id)),
      ];
      const removedMenuIds = existingMenuIds.filter(
        (id) => !menu_id.includes(id),
      );

      // Remove menu_ingredient entries for removed menus
      if (removedMenuIds.length > 0) {
        await this.menuIngredientRepository.delete({
          menu: { menu_id: In(removedMenuIds) },
          owner: { owner_id },
          branch: { branch_id },
          is_addon: true,
        });
      }

      // 1. Get all existing add-ons
      const existingAddOns = await this.addOnRepository.find({
        where: {
          owner: { owner_id },
          branch: { branch_id },
        },
        relations: ['ingredient'],
      });

      // Get IDs that will remain
      const keepAddOnIds = options
        .filter((opt) => opt.add_on_id !== 'null')
        .map((opt) => opt.add_on_id);

      // 2. Handle deleted add-ons
      const addOnsToRemove = existingAddOns.filter(
        (addOn) => !keepAddOnIds.includes(addOn.add_on_id),
      );

      if (addOnsToRemove.length > 0) {
        const ingredientIds = addOnsToRemove.map(
          (addOn) => addOn.ingredient.ingredient_id,
        );

        // Mark ingredients as deleted
        await this.ingredientRepository.update(
          { ingredient_id: In(ingredientIds) },
          { is_delete: true },
        );
      }

      // 3. Process each option
      for (const option of options) {
        if (option.add_on_id !== 'null') {
          // Update existing add-on
          await this.addOnRepository.update(
            { add_on_id: option.add_on_id },
            {
              add_on_price: parseFloat(option.price),
              is_required: is_require,
              is_multipled: is_multiple,
            },
          );

          // Get ingredient_id for this add-on
          const addOn = await this.addOnRepository.findOne({
            where: { add_on_id: option.add_on_id },
            relations: ['ingredient'],
          });

          if (addOn?.ingredient) {
            // Update ingredient
            await this.ingredientRepository.update(
              { ingredient_id: addOn.ingredient.ingredient_id },
              { unit: option.unit },
            );

            // Update or create menu ingredient
            for (const menuId of menu_id) {
              const menuIngredient =
                await this.menuIngredientRepository.findOne({
                  where: {
                    menu: { menu_id: menuId },
                    ingredient: {
                      ingredient_id: addOn.ingredient.ingredient_id,
                    },
                  },
                });

              if (menuIngredient) {
                await this.menuIngredientRepository.update(
                  { menu_ingredient_id: menuIngredient.menu_ingredient_id },
                  { quantity_used: option.quantity },
                );
              } else {
                await this.menuIngredientRepository.save({
                  menu_ingredient_id: uuidv4(),
                  menu: { menu_id: menuId },
                  ingredient: { ingredient_id: addOn.ingredient.ingredient_id },
                  quantity_used: option.quantity,
                  is_addon: true,
                  owner: { owner_id },
                  branch: { branch_id },
                });
              }
            }
          }
        } else {
          // Handle new add-on
          // First check if ingredient exists
          let ingredient = await this.ingredientRepository.findOne({
            where: {
              ingredient_name: option.add_on_name,
              owner: { owner_id },
              branch: { branch_id },
            },
          });

          if (!ingredient) {
            // Create new ingredient
            ingredient = await this.ingredientRepository.save({
              ingredient_name: option.add_on_name,
              unit: option.unit,
              owner: { owner_id },
              branch: { branch_id },
            });
          }

          // Create new add-on
          const newAddOn = await this.addOnRepository.save({
            ingredient: ingredient,
            add_on_price: parseFloat(option.price),
            is_required: is_require,
            is_multipled: is_multiple,
            owner: { owner_id },
            branch: { branch_id },
          });
          console.log('newAddOn', newAddOn);
          // Create menu ingredients
          for (const menuId of menu_id) {
            await this.menuIngredientRepository.save({
              menu: { menu_id: menuId },
              ingredient: ingredient,
              quantity_used: option.quantity,
              is_addon: true,
              owner: { owner_id },
              branch: { branch_id },
            });
          }
        }
      }

      return { message: 'Add-on options updated successfully' };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteSweetness(
    sweetness_group_name: string,
    ownerId: string,
    branchId: string,
  ) {
    // 1. Find all sweetness groups with the given name and get their sweetness levels
    const sweetnessGroups = await this.sweetnessGroupRepository.find({
      where: {
        sweetness_group_name,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['sweetnessLevel'],
    });

    if (!sweetnessGroups.length) {
      throw new NotFoundException(
        `Sweetness group "${sweetness_group_name}" not found`,
      );
    }

    // Get all sweetness level IDs from the groups
    const sweetnessLevelIds = sweetnessGroups.map(
      (group) => group.sweetnessLevel.sweetness_id,
    );

    // 1. Soft delete the sweetness levels
    await this.sweetnessLevelRepository.update(
      {
        sweetness_id: In(sweetnessLevelIds),
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      { is_delete: true },
    );

    // 2. Find menus that use this sweetness group and set to null
    const menusToUpdate = await this.menuRepository.find({
      where: {
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['sweetnessGroup'],
    });

    const menusWithThisSweetnessGroup = menusToUpdate.filter(
      (menu) =>
        menu.sweetnessGroup?.sweetness_group_name === sweetness_group_name,
    );

    for (const menu of menusWithThisSweetnessGroup) {
      menu.sweetnessGroup = null;
      await this.menuRepository.save(menu);
    }

    // 3. Delete the sweetness groups
    await this.sweetnessGroupRepository.delete({
      sweetness_group_name,
      owner: { owner_id: ownerId },
      branch: { branch_id: branchId },
    });

    return {
      message: `Sweetness group "${sweetness_group_name}" and its levels have been deleted`,
      statusCode: HttpStatus.OK,
    };
  }

  async getMenuIngredients(
    menu_id: string,
    owner_id: string,
    branch_id: string,
  ) {
    // ตรวจสอบว่ามี menu, owner, branch อยู่จริง
    const menu = await this.menuRepository.findOne({ where: { menu_id } });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menu_id} not found`);
    }

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

    // ดึงข้อมูล menu_ingredient ทั้งหมดที่เชื่อมกับ menu นี้
    const menuIngredients = await this.menuIngredientRepository.find({
      where: {
        menu: { menu_id },
        owner: { owner_id },
        branch: { branch_id },
        is_addon: false,
      },
      relations: ['ingredient', 'size', 'menu_type'],
    });

    // จัดกลุ่มข้อมูลตาม ingredient
    const ingredientGroups = new Map<string, any>();

    menuIngredients.forEach((mi) => {
      const ingredientName = mi.ingredient.ingredient_name;

      if (!ingredientGroups.has(ingredientName)) {
        ingredientGroups.set(ingredientName, {
          ingredient_name: ingredientName,
          unit: mi.ingredient.unit,
          ingredientListForStock: [],
        });
      }

      ingredientGroups.get(ingredientName).ingredientListForStock.push({
        size_id: mi.size.size_id,
        menu_type_id: mi.menu_type.menu_type_id,
        quantity_used: mi.quantity_used,
      });
    });

    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    const menuData = Array.from(ingredientGroups.values());

    return {
      menuData,
    };
  }

  async getGroupData(
    type: string,
    groupName: string,
    ownerId: string,
    branchId: string,
  ) {
    try {
      switch (type) {
        case 'sweetness':
          // 1. First find the sweetness group
          const sweetnessGroup = await this.sweetnessGroupRepository
            .createQueryBuilder('sg')
            .leftJoinAndSelect('sg.owner', 'owner')
            .leftJoinAndSelect('sg.branch', 'branch')
            .where('sg.sweetness_group_name = :groupName', { groupName })
            .andWhere('owner.owner_id = :ownerId', { ownerId })
            .andWhere('branch.branch_id = :branchId', { branchId })
            .getOne();

          if (!sweetnessGroup) {
            throw new NotFoundException(
              `Sweetness group "${groupName}" not found`,
            );
          }

          // 2. Get all sweetness levels that belong to this group
          const sweetnessLevels = await this.sweetnessLevelRepository
            .createQueryBuilder('sl')
            .leftJoinAndSelect('sl.sweetnessGroup', 'sg')
            .where('sg.sweetness_group_name = :groupName', { groupName })
            .andWhere('sg.owner.owner_id = :ownerId', { ownerId })
            .andWhere('sg.branch.branch_id = :branchId', { branchId })
            .andWhere('sl.is_delete = :isDelete', { isDelete: false })
            .select(['sl.sweetness_id', 'sl.level_name'])
            .getMany();

          // Get menus using this sweetness group
          const menus = await this.menuRepository
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.sweetnessGroup', 'sg')
            .where('sg.sweetness_group_name = :groupName', { groupName })
            .andWhere('sg.owner.owner_id = :ownerId', { ownerId })
            .andWhere('sg.branch.branch_id = :branchId', { branchId })
            .andWhere('m.is_delete = :isDelete', { isDelete: false })
            .select(['m.menu_id', 'm.menu_name'])
            .getMany();

          return {
            group_name: groupName,
            levels: sweetnessLevels.map((level) => ({
              sweetness_id: level.sweetness_id,
              level_name: level.level_name,
            })),
            menus: menus.map((menu) => ({
              menu_id: menu.menu_id,
              menu_name: menu.menu_name,
            })),
          };

        case 'size':
          const sizeGroups = await this.sizeGroupRepository.find({
            where: {
              size_group_name: groupName,
              owner: { owner_id: ownerId },
              branch: { branch_id: branchId },
            },
            relations: ['size', 'menu'],
          });
          return {
            group_name: groupName,
            sizes: sizeGroups.map((group) => ({
              size_id: group.size.size_id,
              size_name: group.size.size_name,
              size_price: group.size.size_price,
              is_delete: group.size.is_delete,
            })),
            menus: sizeGroups[0]?.menu || [],
          };

        case 'menu-type':
          const menuTypeGroups = await this.menuTypeGroupRepository.find({
            where: {
              menu_type_group_name: groupName,
              owner: { owner_id: ownerId },
              branch: { branch_id: branchId },
            },
            relations: ['menuType', 'menu'],
          });
          return {
            group_name: groupName,
            types: menuTypeGroups.map((group) => ({
              menu_type_id: group.menuType.menu_type_id,
              type_name: group.menuType.type_name,
              price_difference: group.menuType.price_difference,
              is_delete: group.menuType.is_delete,
            })),
            menus: menuTypeGroups[0]?.menu || [],
          };

        case 'add-ons':
          // Call our new method for add-ons
          return this.getAddOnDetails(ownerId, branchId);

        default:
          throw new BadRequestException('Invalid group type');
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get group data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllOptionGroups(ownerId: string, branchId: string) {
    try {
      // Get all sweetness groups
      const sweetnessGroups = await this.sweetnessGroupRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
        select: ['sweetness_group_name'],
      });

      // Get all size groups
      const sizeGroups = await this.sizeGroupRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
        select: ['size_group_name'],
      });

      // Get all menu type groups
      const menuTypeGroups = await this.menuTypeGroupRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
        select: ['menu_type_group_name'],
      });

      // Get all add-ons
      const addOns = await this.addOnRepository.find({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
        relations: ['ingredient'],
        select: ['add_on_id', 'add_on_price', 'is_required', 'is_multipled'],
      });

      return {
        sweetness_groups: [
          ...new Set(sweetnessGroups.map((g) => g.sweetness_group_name)),
        ],
        size_groups: [...new Set(sizeGroups.map((g) => g.size_group_name))],
        menu_type_groups: [
          ...new Set(menuTypeGroups.map((g) => g.menu_type_group_name)),
        ],
        add_ons: addOns.map((addon) => ({
          add_on_id: addon.add_on_id,
          ingredient_name: addon.ingredient.ingredient_name,
          price: addon.add_on_price,
          is_required: addon.is_required,
          is_multipled: addon.is_multipled,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get option groups',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAddOnDetails(ownerId: string, branchId: string) {
    try {
      // 1. Get all add-ons with ingredient info
      const addOns = await this.addOnRepository
        .createQueryBuilder('ao')
        .leftJoinAndSelect('ao.ingredient', 'ing')
        .leftJoinAndSelect('ao.owner', 'owner')
        .leftJoinAndSelect('ao.branch', 'branch')
        .where('owner.owner_id = :ownerId', { ownerId })
        .andWhere('branch.branch_id = :branchId', { branchId })
        .getMany();

      // 2. Get menu ingredients for each add-on
      const menuIngredients = await this.menuIngredientRepository
        .createQueryBuilder('mi')
        .leftJoinAndSelect('mi.menu', 'menu')
        .leftJoinAndSelect('mi.ingredient', 'ing')
        .where('mi.is_addon = :isAddon', { isAddon: true })
        .andWhere('mi.owner.owner_id = :ownerId', { ownerId })
        .andWhere('mi.branch.branch_id = :branchId', { branchId })
        .getMany();

      // 3. Format the response
      const options = addOns.map((addon) => ({
        add_on_id: addon.add_on_id.toString(),
        add_on_name: addon.ingredient.ingredient_name,
        price: Number(addon.add_on_price).toFixed(2),
        quantity:
          menuIngredients.find(
            (mi) =>
              mi.ingredient.ingredient_id === addon.ingredient.ingredient_id,
          )?.quantity_used || 0,
        unit: addon.ingredient.unit,
      }));

      // Get unique menu IDs from menu ingredients
      const menuIds = [
        ...new Set(menuIngredients.map((mi) => mi.menu.menu_id)),
      ];

      // Get is_required and is_multiple from first add-on
      const firstAddOn = addOns[0];

      return {
        options,
        menu_id: menuIds,
        is_require: firstAddOn?.is_required || false,
        is_multiple: firstAddOn?.is_multipled || false,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get add-on details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMenuOptions(menu_id: number, owner_id: number, branch_id: number) {
    try {
      // Find the menu with its size group and menu type group
      const menu = await this.menuRepository
        .createQueryBuilder('menu')
        .leftJoinAndSelect('menu.sizeGroup', 'sg')
        .leftJoinAndSelect('menu.menuTypeGroup', 'mtg')
        .where('menu.menu_id = :menu_id', { menu_id })
        .andWhere('menu.owner.owner_id = :owner_id', { owner_id })
        .andWhere('menu.branch.branch_id = :branch_id', { branch_id })
        .getOne();

      if (!menu) {
        throw new NotFoundException(`Menu with ID ${menu_id} not found`);
      }

      // Get sizes for this menu's size group
      const sizes = await this.sizeRepository
        .createQueryBuilder('size')
        .leftJoin('size.sizeGroup', 'sg')
        .where('sg.size_group_name = :groupName', {
          groupName: menu.sizeGroup?.size_group_name,
        })
        .andWhere('size.owner.owner_id = :owner_id', { owner_id })
        .andWhere('size.branch.branch_id = :branch_id', { branch_id })
        .andWhere('size.is_delete = :isDelete', { isDelete: false })
        .select(['size.size_id', 'size.size_name'])
        .getMany();

      // Get menu types for this menu's menu type group
      const menuTypes = await this.menuTypeRepository
        .createQueryBuilder('mt')
        .leftJoin('mt.menuTypeGroup', 'mtg')
        .where('mtg.menu_type_group_name = :groupName', {
          groupName: menu.menuTypeGroup?.menu_type_group_name,
        })
        .andWhere('mt.owner.owner_id = :owner_id', { owner_id })
        .andWhere('mt.branch.branch_id = :branch_id', { branch_id })
        .andWhere('mt.is_delete = :isDelete', { isDelete: false })
        .select(['mt.menu_type_id', 'mt.type_name'])
        .getMany();

      return {
        sizes: sizes.map((size) => ({
          size_id: size.size_id,
          size_name: size.size_name,
        })),
        menu_types: menuTypes.map((type) => ({
          type_id: type.menu_type_id,
          type_name: type.type_name,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get menu options',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
