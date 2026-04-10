// ── Category Types ───────────────────────────────────────────────────────────

// ── Category Create ──────────────────────────────────────────────────────────
export interface CategoryCreate {
  name: string;
  description?: string | null;
}

// ── Category ─────────────────────────────────────────────────────────────────
export interface Category extends CategoryCreate {
  id: number;
}
