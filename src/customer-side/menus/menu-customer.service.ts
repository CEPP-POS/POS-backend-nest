import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from 'src/entities/menu.entity';
import { Category } from 'src/entities/category.entity';
import { MenuIngredient } from 'src/entities/menu-ingredient.entity';
import { MenuType } from 'src/entities/menu-type.entity';
import { MenuTypeGroup } from 'src/entities/menu-type-group.entity';
import { SweetnessLevel } from 'src/entities/sweetness-level.entity';
import { Size } from 'src/entities/size.entity';
import { SweetnessGroup } from 'src/entities/sweetness-group.entity';
import { SizeGroup } from 'src/entities/size-group.entity';
import { AddOn } from 'src/entities/add-on.entity';
import { Ingredient } from 'src/entities/ingredient.entity';

@Injectable()
export class MenuCustomerService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(MenuIngredient)
    private readonly menuIngredientRepository: Repository<MenuIngredient>,

    @InjectRepository(MenuType)
    private readonly menuTypeRepository: Repository<MenuType>,

    @InjectRepository(MenuTypeGroup)
    private readonly menuTypeGroupRepository: Repository<MenuTypeGroup>,

    @InjectRepository(SweetnessLevel)
    private readonly sweetnessLevelRepository: Repository<SweetnessLevel>,

    @InjectRepository(SweetnessGroup)
    private readonly sweetnessGroupRepository: Repository<SweetnessGroup>,

    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,

    @InjectRepository(SizeGroup)
    private readonly sizeGroupRepository: Repository<SizeGroup>,

    @InjectRepository(AddOn)
    private readonly addOnRepository: Repository<AddOn>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {}

  async getCustomerMenus() {
    // ดึงเมนูทั้งหมดพร้อม category
    const menus = await this.menuRepository.find({
      relations: ['category'], // ✅ โหลด category ให้ menu
    });

    // แปลงข้อมูลเมนูให้อยู่ในรูปแบบที่ต้องการ
    const available_menus = menus.map((menu) => ({
      menu_name: menu.menu_name,
      description: menu.description,
      price: menu.price,
      // category: [menu.category.category_name], // ✅ ดึง category เป็น array
    }));

    // ดึงหมวดหมู่ทั้งหมดที่มีเมนู
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .innerJoin('category.menus', 'menu') // ✅ ใช้ category.menus
      .select('category.category_name')
      .distinct()
      .getRawMany();

    const available_category = categories.map((c) => c.category_category_name); // ✅ แก้ชื่อฟิลด์ให้ถูกต้อง

    return {
      available_category,
      available_menus,
    };
  }

  // edit entity
  // async getMenusAllCategory() {
  //   // Fetch categories with related menus
  //   const categories = await this.categoryRepository.find({
  //     relations: ['menu'],
  //   });

  //   // Extract unique category names
  //   const categoryNames = Array.from(new Set(categories.map(cat => cat.category_name)));

  // Group menus by menu_id
  // edit entity
  // const menuMap = categories.reduce((map, category) => {
  //   category.menu.forEach(menu => {
  //     if (!map.has(menu.menu_id)) {
  //       map.set(menu.menu_id, {
  //         menu_id: menu.menu_id,
  //         menu_name: menu.menu_name,
  //         description: menu.description,
  //         price: Number(menu.price),
  //         image_url: menu.image_url,
  //         category: [], // Store category objects
  //       });
  //     }

  //     // Add category details (avoid duplicates)
  //     const existingCategories = map.get(menu.menu_id).category;
  //     if (!existingCategories.some((c) => c.category_id === category.category_id)) {
  //       existingCategories.push({
  //         category_id: category.category_id,
  //         category_name: category.category_name,
  //       });
  //     }
  //   });

  //   return map;
  // },
  //   new Map<number, any>());

  //   // Convert Map to Array
  //   const availableMenus = Array.from(menuMap.values());

  //   return {
  //     available_category: categoryNames,
  //     available_menus: availableMenus,
  //   };
  // }

  // EDIT ENTITY
  async getMenuDetails(menuId: number, ownerId: number, branchId: number) {
    // 1. ค้นหาข้อมูลพื้นฐานของเมนู
    const menu = await this.menuRepository.findOne({
      where: {
        menu_id: menuId,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['menuTypeGroup'], // เพิ่ม relation นี้
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menuId} not found`);
    }

    // 2. ค้นหา menu types จาก menu type group
    const menuTypes = menu.menuTypeGroup
      ? await this.menuTypeRepository
          .createQueryBuilder('mt')
          .innerJoin(
            'menu_type_group',
            'mtg',
            'mtg.menu_type_id = mt.menu_type_id',
          )
          .where((qb) => {
            const subQuery = qb
              .subQuery()
              .select('menu_type_group_name')
              .from('menu_type_group', 'mtg2')
              .where('mtg2.menu_type_group_id = :groupId')
              .getQuery();
            return 'mtg.menu_type_group_name = ' + subQuery;
          })
          .setParameter('groupId', menu.menuTypeGroup.menu_type_group_id)
          .andWhere('mt.is_delete = :isDelete', { isDelete: false })
          .distinct()
          .select([
            'mt.menu_type_id as menu_type_id',
            'mt.type_name as type_name',
            'mt.price_difference as price_difference',
          ])
          .getRawMany()
      : [];

    // เพิ่ม log เพื่อดูผลลัพธ์
    console.log('All menu types:', menuTypes);

    // 3. ค้นหา sweetness levels จาก sweetness group
    const sweetnessLevels = await this.sweetnessLevelRepository
      .createQueryBuilder('sl')
      .innerJoin('sweetness_group', 'sg', 'sg.sweetness_id = sl.sweetness_id')
      .where('sg.sweetness_group_name = :groupName', {
        groupName: menu.sweetnessGroup,
      })
      .andWhere('sl.is_delete = :isDelete', { isDelete: false })
      .select([
        'sl.sweetness_id as sweetness_id',
        'sl.level_name as level_name',
      ])
      .getRawMany();

    // 4. ค้นหา sizes จาก size group
    const sizes = await this.sizeRepository
      .createQueryBuilder('s')
      .innerJoin('size_group', 'sg', 'sg.size_id = s.size_id')
      .where('sg.size_group_name = :groupName', { groupName: menu.sizeGroup })
      .andWhere('s.is_delete = :isDelete', { isDelete: false })
      .select([
        's.size_id as size_id',
        's.size_name as size_name',
        's.size_price as size_price',
      ])
      .getRawMany();

    // 5. ค้นหา add-ons
    const addOns = await this.addOnRepository
      .createQueryBuilder('ao')
      .innerJoin('menu_ingredient', 'mi', 'mi.ingredient_id = ao.ingredient_id')
      .innerJoin('ingredient', 'i', 'i.ingredient_id = ao.ingredient_id')
      .where('mi.menu_id = :menuId', { menuId })
      .andWhere('mi.is_addon = :isAddon', { isAddon: true })
      .andWhere('mi.owner_id = :ownerId', { ownerId })
      .andWhere('mi.branch_id = :branchId', { branchId })
      .select([
        'ao.add_on_id as add_on_id',
        'i.ingredient_name as ingredient_name',
        'ao.add_on_price as add_on_price',
        'ao.is_required as is_required',
        'ao.is_multipled as is_multiple',
      ])
      .getRawMany();

    // 6. รวมข้อมูลและส่งกลับ
    return {
      menu_id: menu.menu_id,
      menu_name: menu.menu_name,
      price: menu.price,
      description: menu.description,
      image_url: menu.image_url,
      menu_type_group: menuTypes,
      sweetness_group: sweetnessLevels,
      size_group: sizes,
      add_on_name: addOns,
    };
  }

  //   async getMenusAllCategory() {
  //     const categories = await this.categoryRepository.find({
  //       relations: ['menu'], // ✅ โหลดเมนูทั้งหมดในแต่ละ Category
  //     });

  //     // ✅ ดึงชื่อ Category ทั้งหมดเป็นอาร์เรย์ (ลบค่าที่ซ้ำกันด้วย Set)
  //     const categoryNames = [
  //       ...new Set(categories.map((cat) => cat.category_name)),
  //     ];

  //     // ✅ ดึงเมนูและจัดกลุ่มตามหมวดหมู่
  //     const menuMap = new Map();

  //     categories.forEach((category) => {
  //       category.menu.forEach((menu) => {
  //         if (!menuMap.has(menu.menu_id)) {
  //           menuMap.set(menu.menu_id, {
  //             menu_name: menu.menu_name,
  //             description: menu.description,
  //             price: menu.price, // ✅ แปลง price เป็น number
  //             image_url: menu.image_url,
  //             category: [category.category_name], // ✅ เก็บหมวดหมู่ที่เมนูนี้อยู่
  //           });
  //         }
  //         menuMap.get(menu.menu_id).category.push(category.category_name);
  //       });
  //     });

  //     return {
  //       available_category: categoryNames, // ✅ ส่งชื่อหมวดหมู่ทั้งหมดกลับไปด้วย
  //       available_menus: Array.from(menuMap.values()), // ✅ คืนค่ารายการเมนูพร้อมหมวดหมู่
  //     };
  //   }
}
