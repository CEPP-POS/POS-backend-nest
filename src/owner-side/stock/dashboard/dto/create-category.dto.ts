import { IsString } from "class-validator";

export class CreateCategoryDto {
  @IsString()  // Uncomment this decorator to validate the category_name
  category_name: string;  // A single field to store the category name
}
