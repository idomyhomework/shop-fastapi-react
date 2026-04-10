# Phase 1 — Remaining Frontend Steps

## What's done (backend complete)
- `backend/app/models.py` — User model with all fields
- `backend/app/core/security.py` — hash_password, verify_password, JWT creation/decode
- `backend/app/core/dependencies.py` — get_current_user, require_admin
- `backend/app/routers/auth.py` — /auth/register, /auth/login, /auth/logout, /auth/refresh, /auth/me
- `backend/app/services/auth_service.py` — register_user, authenticate_user, get_user_by_email
- `backend/main.py` — auth router included, all 3 admin routers protected with require_admin
- Migration applied, admin user seeded

---

## Step 1 — Install packages

```bash
cd frontend
pnpm add @reduxjs/toolkit react-redux
```

---

## Step 2 — Redux Store

**New file:** `frontend/src/store/index.ts`
```ts
// ── Store ───────────────────────────────────────────────────────────────────
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/api";
import authReducer from "../features/auth/slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**New file:** `frontend/src/store/hooks.ts`
```ts
// ── Typed Redux Hooks ──────────────────────────────────────────────────────
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## Step 3 — Auth Feature: Types

**New file:** `frontend/src/features/auth/types.ts`
```ts
// ── Auth Types ─────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  is_active: boolean;
  loyalty_points: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}
```

---

## Step 4 — Auth Feature: RTK Query API

**New file:** `frontend/src/features/auth/api.ts`
```ts
// ── Auth API ───────────────────────────────────────────────────────────────
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../config";
import type { User, LoginRequest, RegisterRequest } from "./types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include", // sends HttpOnly cookies automatically
  }),
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => "/auth/me",
    }),
    login: builder.mutation<User, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    register: builder.mutation<User, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} = authApi;
```

---

## Step 5 — Auth Feature: Redux Slice

**New file:** `frontend/src/features/auth/slice.ts`
```ts
// ── Auth Slice ─────────────────────────────────────────────────────────────
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ── Set User ───────────────────────────────────────────────────────────
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    // ── Clear User ─────────────────────────────────────────────────────────
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
```

---

## Step 6 — Login Modal

**New file:** `frontend/src/features/auth/components/LoginModal.tsx`

Props: `open: boolean` — no close button (it's the admin gate, must log in to proceed).

```tsx
// ── Login Modal ────────────────────────────────────────────────────────────
import { useState } from "react";
import { useLoginMutation } from "../api";
import { setUser } from "../slice";
import { useAppDispatch } from "../../../store/hooks";

interface Props {
  open: boolean;
}

export default function LoginModal({ open }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useAppDispatch();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login({ email, password }).unwrap();
      dispatch(setUser(user));
    } catch {
      // error displayed via RTK error state
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
        {/* ── Title ───────────────────────────────────────────────────── */}
        <h2 className="text-xl font-semibold mb-6 text-center">Acceso admin</h2>

        {/* ── Form ────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2"
            required
          />
          {error && (
            <p className="text-red-500 text-sm text-center">
              Email o contraseña incorrectos
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-violet-600 text-white rounded-lg py-2 font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## Step 7 — Providers

**New file:** `frontend/src/app/providers.tsx`
```tsx
// ── App Providers ──────────────────────────────────────────────────────────
import { Provider } from "react-redux";
import { store } from "../store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

---

## Step 8 — Admin Guard

**New file:** `frontend/src/app/AdminGuard.tsx`

Calls `GET /auth/me` on mount. Admin → renders children. Not authenticated or not admin → shows LoginModal.

```tsx
// ── Admin Guard ────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useGetMeQuery } from "../features/auth/api";
import { setUser } from "../features/auth/slice";
import { useAppDispatch } from "../store/hooks";
import LoginModal from "../features/auth/components/LoginModal";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetMeQuery();
  const dispatch = useAppDispatch();

  // ── Sync fetched user into Redux ───────────────────────────────────────
  useEffect(() => {
    if (user) dispatch(setUser(user));
  }, [user, dispatch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  // ── Not authenticated or not admin → show login ────────────────────────
  if (!user || user.role !== "admin") {
    return <LoginModal open={true} />;
  }

  return <>{children}</>;
}
```

---

## Step 9 — Router

**New file:** `frontend/src/app/router.tsx`
```tsx
// ── App Router ─────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminPanel } from "../pages/admin/AdminPanel";
import { CategoriesPage } from "../pages/CategoriesPage";
import { AdminGuard } from "./AdminGuard";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/categories" replace />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route
          path="/admin/*"
          element={
            <AdminGuard>
              <AdminPanel />
            </AdminGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Step 10 — Update App.tsx

**File:** `frontend/src/App.tsx` — replace entire file:
```tsx
// ── App ────────────────────────────────────────────────────────────────────
import { Providers } from "./app/providers";
import { AppRouter } from "./app/router";

function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}

export default App;
```

Delete `import "./App.css"` — Tailwind handles all styling.

---

## Step 11 — Add credentials to existing services

Without `credentials: "include"`, the auth cookie is never sent and every admin API call returns 401.

**File:** `frontend/src/pages/admin/components/services/categoryService.ts`

Add `credentials: "include"` to all 4 fetch calls (`fetch`, `create`, `edit`, `delete`):
```ts
const response = await fetch(`${BASE_URL}/categories`, {
  credentials: "include",   // ← add this line to every fetch
});
```

**File:** `frontend/src/pages/admin/components/services/productService.ts`

Same — add `credentials: "include"` to all 8 fetch calls:
`fetchProducts`, `fetchCategories`, `create`, `delete`, `edit`, `uploadImage`, `deleteImage`, `toggleActive`

---

## Verification checklist

- [ ] `http://localhost:5173/admin` → LoginModal appears (not logged in)
- [ ] Login with admin credentials → AdminPanel loads
- [ ] Create a category → succeeds (cookie sent with request)
- [ ] DevTools → Application → Cookies → `access_token` and `refresh_token` present and HttpOnly
- [ ] Clear cookies → reload `/admin` → LoginModal appears again
- [ ] `GET http://127.0.0.1:8000/categories` without cookie → 401
