export interface ProductCreate {
   name: string;
   description?: string | null;
   price: number;
   is_active?: boolean;
   category_ids: number[];
   bar_code: string;
   stock_quantity?: number;
}

export interface ProductImage {
   id: number;
   image_url: string;
   is_main: boolean;
}

export interface CategoryInProduct {
   id: number;
   name: string;
}

export interface Product {
   id: number;
   name: string;
   description: string | null;
   price: number;
   is_active: boolean;
   bar_code: string;
   stock_quantity: number;
   categories: CategoryInProduct[];
   images: ProductImage[];
}

export type ProductFilters = {
   name: string;
   bar_code: string;
   stock: string;
   price: string;
   active: "all" | "active" | "inactive";
   categoryId: string;
};

export type ProductListResponse = {
   items: Product[];
   total: number;
   page: number;
   page_size: number;
   pages: number;
};