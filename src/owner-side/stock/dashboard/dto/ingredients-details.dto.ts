
export class IngredientDetailsDto {
    // Ingredient details
    ingredient_id: number;
    ingredient_name: string;
    net_volume: number;
    quantity_in_stock: number;
    total_volume: number;
    category_name: string;
  
    // Menu Ingredients array
    menu_ingredients: MenuIngredientDto[];
  }
  
  // MenuIngredientDto represents the menu ingredient details
  export class MenuIngredientDto {
    menu_ingredient_id: number;
    menu_id: number;  // Linked to Menu table
    ingredient_id: number;  // Linked to Ingredient table
    size_id: string;
    level_id: string; // For example: 'หวานน้อย'
    quantity_used: number;
  }