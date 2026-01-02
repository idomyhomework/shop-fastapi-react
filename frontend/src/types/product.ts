export interface ProductCreate {
   name: string;
   description: string | null;
   price: number;
   is_active: boolean;
   category_ids: number[];
   bar_code: string;
   stock_quantity: number;
}

export interface ProductImage {
   id: number;
   image_url: string;
   is_main: boolean;
}

export interface Product {
   id: number;
   name: string;
   description: string | null;
   price: number;
   is_active: boolean;
   bar_code: string;
   stock_quantity: number;
   categories: Array<{
      id: number;
      name: string;
   }>;
   images: ProductImage[];
}
