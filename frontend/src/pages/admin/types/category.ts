// ── Category Types ───────────────────────────────────────────────────────────

// ── Category Create ──────────────────────────────────────────────────────────
export interface CategoryCreate {
   name: string;
   description?: string | null;
   is_super: boolean;
   parent_id?: number | null;
   background_color?: string | null;
   sort_order?: number;
}

// ── Category ─────────────────────────────────────────────────────────────────
export interface Category extends CategoryCreate {
   id: number;
   image_url?: string | null;
}
