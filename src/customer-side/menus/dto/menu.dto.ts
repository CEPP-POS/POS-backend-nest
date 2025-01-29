
export class MenuTypeDTO {
    name: string;
    price_addition: number;
  }
  
  export class MenuSizeDTO {
    name: string;
    price_addition: number;
  }
  
  export class MenuAddOnDTO {
    name: string;
    price_addition: number;
  }
  
  export class MenuDTO {
    menu_name: string;
    price: number;
    description: string;
    image_url: string;
    type_name: MenuTypeDTO[];
    level_name: string[];
    size_name: MenuSizeDTO[];
    add_on_name: MenuAddOnDTO[];
  }
  