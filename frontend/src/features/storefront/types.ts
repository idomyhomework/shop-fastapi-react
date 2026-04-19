// ── Storefront Types ─────────────────────────────────────────────────────────

// ── Category ──────────────────────────────────────────────────────────────────
export interface Category {
   id: number;
   name: string;
   description: string | null;
   is_super: boolean;
   parent_id: number | null;
   image_url: string | null;
   background_color: string | null;
   sort_order: number;
}

// ── Category tree types (homepage sections) ───────────────────────────────────
export interface CategoryChild {
   id: number;
   name: string;
   image_url: string | null;
   background_color: string | null;
   sort_order: number;
}

export interface CategoryTree {
   id: number;
   name: string;
   sort_order: number;
   children: CategoryChild[];
}

// ── Product Image ─────────────────────────────────────────────────────────────
export interface ProductImage {
   id: number;
   image_url: string;
   is_main: boolean;
}

// ── Category In Product (nested) ──────────────────────────────────────────────
export interface CategoryInProduct {
   id: number;
   name: string;
}

// ── Product ───────────────────────────────────────────────────────────────────
export interface Product {
   id: number;
   name: string;
   description: string | null;
   price: string;
   current_price: string;
   stock_quantity: number;
   is_active: boolean;
   bar_code: string;
   has_discount: boolean;
   discount_percentage: number | null;
   discount_end_date: string | null;
   categories: CategoryInProduct[];
   images: ProductImage[];
}

// ── Product List Response ─────────────────────────────────────────────────────
export interface ProductListResponse {
   items: Product[];
   total: number;
   page: number;
   page_size: number;
   pages: number;
}

// ── Products Query Params ─────────────────────────────────────────────────────
export interface ProductsQueryParams {
   q?: string;
   category_id?: number;
   super_category_id?: number;
   has_discount?: boolean;
   page?: number;
   page_size?: number;
   sort?: "popular" | "price_asc" | "price_desc";
}
