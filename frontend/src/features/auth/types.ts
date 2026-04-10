// ── Auth Types ─────────────────────────────────────────────────────────────

// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  is_active: boolean;
  loyalty_points: number;
}

// ── Login Request ────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

// ── Register Request ─────────────────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}