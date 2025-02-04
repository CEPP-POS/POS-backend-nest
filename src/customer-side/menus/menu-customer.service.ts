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
      //   category: [menu.category.category_name], // ✅ ดึง category เป็น array
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
    const categories = await this.categoryRepository.find({
      relations: ['menu'], // ✅ โหลดเมนูทั้งหมดในแต่ละ Category
    });

    // ✅ ดึงชื่อ Category ทั้งหมดเป็นอาร์เรย์ (ลบค่าที่ซ้ำกันด้วย Set)
    const categoryNames = [
      ...new Set(categories.map((cat) => cat.category_name)),
    ];

    // ✅ ดึงเมนูและจัดกลุ่มตามหมวดหมู่
    const menuMap = new Map();

    categories.forEach((category) => {
      category.menu.forEach((menu) => {
        if (!menuMap.has(menu.menu_id)) {
          menuMap.set(menu.menu_id, {
            menu_name: menu.menu_name,
            description: menu.description,
            price: Number(menu.price), // ✅ แปลง price เป็น number
            image_url: menu.image_url,
            category: new Set(), // ✅ ใช้ Set เพื่อป้องกันค่าซ้ำ
          });
        }
        menuMap.get(menu.menu_id).category.add(category.category_name); // ✅ เพิ่มค่าใน Set
      });
    });

    // ✅ แปลง `Set` เป็น `array` เพื่อคืนค่า
    const availableMenus = Array.from(menuMap.values()).map((menu) => ({
      ...menu,
      category: Array.from(menu.category), // ✅ แปลง Set เป็น Array
    }));

    return {
      available_category: categoryNames, // ✅ ส่งชื่อหมวดหมู่ทั้งหมดกลับไปด้วย
      available_menus: availableMenus, // ✅ คืนค่ารายการเมนูพร้อมหมวดหมู่
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
      menu_name: menu.menu_name,
      price: menu.price,
      description: menu.description,
      image_url: menu.image_url,
      type_name: menu.menuTypes.map((type) => ({
        name: type.type_name,
        price_addition: type.price_difference,
      })),
      level_name: menu.sweetnessLevels.map((level) => level.level_name),
      size_name: menu.sizes.map((size) => ({
        name: size.size_name,
        price_addition: size.size_price,
      })),
      add_on_name: menu.addOns.map((addOn) => ({
        name: addOn.add_on_name,
        price_addition: addOn.add_on_price,
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
