export class IngredientDto {
  ingredient_id: number;
  ingredient_name: string;
  net_volume: number; // Volume per unit
  unit: string;
  quantity_in_stock: number; // Number of items in stock
  total_volume: number; // Total combined volume
  category_id: number;
  category_name: string;
  expiration_date: Date; // Expiration date of the ingredient
}
