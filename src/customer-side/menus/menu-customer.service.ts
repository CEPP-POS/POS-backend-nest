import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
import { MenuCategory } from 'src/entities/menu_category';

@Injectable()
export class MenuCustomerService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(MenuCategory)
    private readonly menuCategoryRepository: Repository<MenuCategory>,

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

  async getCustomerMenus(ownerId: number, branchId: number) {
    // ดึงข้อมูลเมนูทั้งหมดที่เกี่ยวข้อง
    const menus = await this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.menuCategory', 'menuCategory')
      .leftJoinAndSelect('menuCategory.category', 'category')
      .where('menu.is_delete = :isDelete', { isDelete: false })
      .andWhere('menu.paused = :paused', { paused: false })
      .andWhere('menu.owner_id = :ownerId', { ownerId })
      .andWhere('menu.branch_id = :branchId', { branchId })
      .getMany();

    // สร้าง Map เพื่อจัดกลุ่มเมนูตามหมวดหมู่
    const categoryMap = new Map<string, any>();
    console.log('menus', menus);
    // เพิ่มกลุ่มสำหรับเมนูที่ไม่มีหมวดหมู่
    categoryMap.set('no_category', {
      category_id: null,
      category_name: null,
      menus: [],
    });

    // จัดกลุ่มเมนูตามหมวดหมู่
    menus.forEach((menu) => {
      if (menu.menuCategory.length === 0) {
        // ถ้าเมนูไม่มีหมวดหมู่
        const menuData = {
          menu_id: menu.menu_id,
          menu_name: menu.menu_name,
          description: menu.description,
          price: Number(menu.price),
          image_url: menu.image_url,
        };
        categoryMap.get('no_category').menus.push(menuData);
      } else {
        // จัดกลุ่มตามหมวดหมู่ที่มี
        menu.menuCategory.forEach((mc) => {
          const categoryKey = mc.category
            ? mc.category.category_id.toString()
            : 'no_category';
          const categoryName = mc.category ? mc.category.category_name : null;
          const categoryId = mc.category ? mc.category.category_id : null;

          if (!categoryMap.has(categoryKey)) {
            categoryMap.set(categoryKey, {
              category_id: categoryId,
              category_name: categoryName,
              menus: [],
            });
          }

          const menuData = {
            menu_id: menu.menu_id,
            menu_name: menu.menu_name,
            description: menu.description,
            price: Number(menu.price),
            image_url: menu.image_url,
          };
          categoryMap.get(categoryKey).menus.push(menuData);
        });
      }
    });

    // แปลง Map เป็น Array และกรองเอาเฉพาะหมวดหมู่ที่มีเมนู
    const categories = Array.from(categoryMap.values()).filter(
      (category) => category.menus.length > 0,
    );

    return {
      categories: categories,
    };
  }

  // EDIT ENTITY
  async getMenuDetails(menuId: number, ownerId: number, branchId: number) {
    // ตรวจสอบค่าก่อนใช้งาน
    if (!menuId || !ownerId || !branchId) {
      throw new BadRequestException('Missing required parameters');
    }

    // 1. ค้นหาข้อมูลพื้นฐานของเมนู
    const menu = await this.menuRepository.findOne({
      where: {
        menu_id: menuId,
        owner: { owner_id: ownerId },
        branch: { branch_id: branchId },
      },
      relations: [
        'menuTypeGroup',
        'sizeGroup',
        'sweetnessGroup',
        'owner',
        'branch',
      ],
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
          .andWhere('mt.owner_id = :ownerId', { ownerId: menu.owner.owner_id })
          .andWhere('mt.branch_id = :branchId', {
            branchId: menu.branch.branch_id,
          })
          .distinct()
          .select([
            'mt.menu_type_id as menu_type_id',
            'mt.type_name as type_name',
            'mt.price_difference as price_difference',
          ])
          .getRawMany()
      : [];

    // 3. ค้นหา sweetness levels จาก sweetness group
    const sweetnessLevels = menu.sweetnessGroup
      ? await this.sweetnessLevelRepository
          .createQueryBuilder('sl')
          .innerJoin(
            'sweetness_group',
            'sg',
            'sg.sweetness_id = sl.sweetness_id',
          )
          .where((qb) => {
            const subQuery = qb
              .subQuery()
              .select('sweetness_group_name')
              .from('sweetness_group', 'sg2')
              .where('sg2.sweetness_group_id = :groupId')
              .getQuery();
            return 'sg.sweetness_group_name = ' + subQuery;
          })
          .setParameter('groupId', menu.sweetnessGroup.sweetness_group_id)
          .andWhere('sl.is_delete = :isDelete', { isDelete: false })
          .andWhere('sl.owner_id = :ownerId', { ownerId: menu.owner.owner_id })
          .andWhere('sl.branch_id = :branchId', {
            branchId: menu.branch.branch_id,
          })
          .distinct()
          .select([
            'sl.sweetness_id as sweetness_id',
            'sl.level_name as level_name',
          ])
          .getRawMany()
      : [];

    // 4. ค้นหา sizes จาก size group
    const sizes = menu.sizeGroup
      ? await this.sizeRepository
          .createQueryBuilder('s')
          .innerJoin('size_group', 'sg', 'sg.size_id = s.size_id')
          .where((qb) => {
            const subQuery = qb
              .subQuery()
              .select('size_group_name')
              .from('size_group', 'sg2')
              .where('sg2.size_group_id = :groupId')
              .getQuery();
            return 'sg.size_group_name = ' + subQuery;
          })
          .setParameter('groupId', menu.sizeGroup.size_group_id)
          .andWhere('s.is_delete = :isDelete', { isDelete: false })
          .andWhere('s.owner_id = :ownerId', { ownerId: menu.owner.owner_id })
          .andWhere('s.branch_id = :branchId', {
            branchId: menu.branch.branch_id,
          })
          .distinct()
          .select([
            's.size_id as size_id',
            's.size_name as size_name',
            's.size_price as size_price',
          ])
          .getRawMany()
      : [];

    // 5. ค้นหา add-ons
    const addOns = await this.menuIngredientRepository
      .createQueryBuilder('mi')
      .leftJoin('mi.ingredient', 'i')
      .leftJoin('add_on', 'ao', 'ao.ingredient_id = i.ingredient_id')
      .where('mi.menu_id = :menuId', { menuId: menu.menu_id })
      .andWhere('mi.is_addon = :isAddon', { isAddon: true })
      .andWhere('mi.owner_id = :ownerId', { ownerId: menu.owner.owner_id })
      .andWhere('mi.branch_id = :branchId', { branchId: menu.branch.branch_id })
      .andWhere('i.is_delete = :isDelete', { isDelete: false })
      .andWhere('ao.owner_id = :ownerId', { ownerId: menu.owner.owner_id })
      .andWhere('ao.branch_id = :branchId', { branchId: menu.branch.branch_id })
      .select([
        'ao.add_on_id as add_on_id',
        'i.ingredient_name as ingredient_name',
        'ao.add_on_price as add_on_price',
        'ao.is_required as is_required',
        'ao.is_multipled as is_multiple',
      ])
      .getRawMany();

    // เพิ่ม log เพื่อดู SQL query
    console.log('Menu ID:', menu.menu_id);
    console.log('Owner ID:', menu.owner.owner_id);
    console.log('Branch ID:', menu.branch.branch_id);
    console.log(
      'Raw SQL:',
      this.menuIngredientRepository.createQueryBuilder('mi').getSql(),
    );
    console.log('Add-ons Result:', addOns);

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
      add_on: addOns,
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
