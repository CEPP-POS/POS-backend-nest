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
    const menu = await this.menuRepository.findOne({
      where: {
        menu_id: menuId,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: [
        'menuTypeGroup',
        'menuTypeGroup.menuType',
        'sweetnessGroup',
        'sweetnessGroup.sweetnessLevel',
        'sizeGroup',
        'sizeGroup.size',
        'menuIngredient',
        'menuIngredient.ingredient',
      ],
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menuId} not found`);
    }

    // หา add-ons จาก MenuIngredient
    const addOns = await this.menuIngredientRepository.find({
      where: {
        menu: { menu_id: menuId },
        is_addon: true,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: ['ingredient'],
    });

    // ดึงข้อมูล AddOn เพิ่มเติม
    const addOnDetails = await Promise.all(
      addOns.map(async (addon) => {
        const addOnInfo = await this.addOnRepository.findOne({
          where: {
            ingredient: { ingredient_id: addon.ingredient.ingredient_id },
            owner: { owner_id: ownerId },
            branch: { branch_id: branchId },
          },
        });

        return {
          add_on_id: addon.menu_ingredient_id,
          name: addon.ingredient.ingredient_name,
          price_addition: addOnInfo?.add_on_price || 0,
          is_required: addOnInfo?.is_required || false,
          is_multiple: addOnInfo?.is_multipled || false,
        };
      }),
    );

    return {
      menu_id: menu.menu_id,
      menu_name: menu.menu_name,
      price: menu.price,
      description: menu.description,
      image_url: menu.image_url,

      type_name: menu.menuTypeGroup?.menuType
        ? [
            {
              menu_type_id: menu.menuTypeGroup.menuType.menu_type_id,
              name: menu.menuTypeGroup.menuType.type_name,
              price_addition: menu.menuTypeGroup.menuType.price_difference,
            },
          ]
        : [],

      level_name: menu.sweetnessGroup?.sweetnessLevel
        ? [
            {
              sweetness_id: menu.sweetnessGroup.sweetnessLevel.sweetness_id,
              level_name: menu.sweetnessGroup.sweetnessLevel.level_name,
            },
          ]
        : [],

      size_name: menu.sizeGroup?.size
        ? [
            {
              size_id: menu.sizeGroup.size.size_id,
              name: menu.sizeGroup.size.size_name,
              price_addition: menu.sizeGroup.size.size_price,
            },
          ]
        : [],

      add_on_name: addOnDetails,
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
