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
  menu_name: number;
  size_name: string;
  level_name: string;
  quantity_used: number;
  unit: string;
  category_name: string;
}
