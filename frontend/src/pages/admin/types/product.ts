// ── Product Types ────────────────────────────────────────────────────────────

// ── Product Create ───────────────────────────────────────────────────────────
export interface ProductCreate {
   name: string;
   description?: string | null;
   price: number;
   is_active?: boolean;
   category_ids: number[];
   bar_code: string;
   stock_quantity?: number;
   discount_percentage?: number | null;
   has_discount?: boolean;
   discount_end_date?: string | null;
}

// ── Product Image ────────────────────────────────────────────────────────────
export interface ProductImage {
   id: number;
   image_url: string;
   is_main: boolean;
}

// ── Category In Product ──────────────────────────────────────────────────────
export interface CategoryInProduct {
   id: number;
   name: string;
}

// ── Product ──────────────────────────────────────────────────────────────────
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
   product_discount_percentage: number | null;
   product_has_discount: boolean;
}

// ── Product Filters ──────────────────────────────────────────────────────────
export type ProductFilters = {
   name: string;
   bar_code: string;
   stock: string;
   price: string;
   active: "all" | "active" | "inactive";
   categoryId: string;
   product_has_discount?: boolean;
   discount_end_date?: string | null;
};

// ── Product List Response ────────────────────────────────────────────────────
export type ProductListResponse = {
   items: Product[];
   total: number;
   page: number;
   page_size: number;
   pages: number;
};

// ── Product Update ───────────────────────────────────────────────────────────
export type ProductUpdate = Partial<ProductCreate>;
