import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from 'src/entities/menu.entity';
import { Category } from 'src/entities/category.entity';

@Injectable()
export class MenuCustomerService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

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

  async getMenusAllCategory() {
    // Fetch categories with related menus
    const categories = await this.categoryRepository.find({
      relations: ['menu'],
    });

    // Extract unique category names
    const categoryNames = Array.from(new Set(categories.map(cat => cat.category_name)));

    // Group menus by menu_id
    const menuMap = categories.reduce((map, category) => {
      category.menu.forEach(menu => {
        if (!map.has(menu.menu_id)) {
          map.set(menu.menu_id, {
            menu_id: menu.menu_id,
            menu_name: menu.menu_name,
            description: menu.description,
            price: Number(menu.price),
            image_url: menu.image_url,
            category: [], // Store category objects
          });
        }

        // Add category details (avoid duplicates)
        const existingCategories = map.get(menu.menu_id).category;
        if (!existingCategories.some((c) => c.category_id === category.category_id)) {
          existingCategories.push({
            category_id: category.category_id,
            category_name: category.category_name,
          });
        }
      });

      return map;
    }, new Map<number, any>());

    // Convert Map to Array
    const availableMenus = Array.from(menuMap.values());

    return {
      available_category: categoryNames,
      available_menus: availableMenus,
    };
  }


  async getMenuDetails(menuId: number) {
    const menu = await this.menuRepository.findOne({
      where: { menu_id: menuId },
      relations: ['menuTypes', 'sweetnessLevels', 'sizes', 'addOns'], // ✅ โหลดข้อมูลที่เกี่ยวข้อง
    });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menuId} not found`);
    }

    return {
      menu_id: menu.menu_id,
      menu_name: menu.menu_name,
      price: menu.price,
      description: menu.description,
      image_url: menu.image_url,
      type_name: menu.menuTypes.map((type) => ({
        menu_type_id: type.menu_type_id,
        menu_type_name: type.type_name,
        menu_type_price_addition: type.price_difference,
        menu_type_is_required: type.is_required
      })),
      level_name: menu.sweetnessLevels.map((level) => ({
        sweetness_level_id: level.sweetness_id,
        sweetness_level_name: level.level_name,
        sweetness_level_is_required: level.is_required
      })),
      size_name: menu.sizes.map((size) => ({
        size_id: size.size_id,
        size_name: size.size_name,
        size_price_addition: size.size_price,
        size_is_required: size.is_required
      })),
      add_on_name: menu.addOns.map((addOn) => ({
        add_on_id: addOn.add_on_id,
        add_on_name: addOn.add_on_name,
        add_on_name_price_addition: addOn.add_on_price,
        add_on_is_required: addOn.is_required,
        add_on_is_multiple: addOn.is_multipled,
      })),
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
