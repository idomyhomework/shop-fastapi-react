export interface ProductCreate {
   name: string;
   description: string | null;
   price: number;
   is_active: boolean;
   category_ids: number[];
   bar_code: string;
   stock_quantity: number;
}

export interface Product extends ProductCreate {
   id: number;
   categories: Array<{
      id: number;
      name: string;
   }>;
}
