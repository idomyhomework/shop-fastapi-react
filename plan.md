# Baltika — Full Development Plan

## Context

Baltika is an online grocery store selling Eastern European/Russian food products delivered across Spain. A thorough competitive analysis (see `research/` and `competitive-analysis.html`) revealed the platform currently scores 24/80 vs. competitors who score 55–69/80. The primary gaps are: no customer-facing storefront, no auth system, no orders/cart, Russian-only UI (invisible to Spanish SEO), and weak brand design.

The codebase already has a functional **admin panel** (product + category CRUD with image management), a solid async FastAPI backend, and a clean React/TypeScript frontend shell. This plan picks up from that state and delivers a full-stack e-commerce platform.

---

## Current State (What's Done)

### Backend
- `backend/app/models.py` — Category, Product, ProductImage models (many-to-many, constraints, computed price)
- `backend/app/schemas.py` — Pydantic v2 schemas for all three entities
- `backend/app/admin_routes/` — categories.py, products.py, images.py routers
- `backend/app/services/` — category_service.py, product_service.py
- `backend/app/database.py` — async SQLAlchemy engine + session
- `backend/app/config.py` — pydantic-settings BaseSettings
- APScheduler job: auto-deactivates expired discounts every 1h

### Frontend
- `frontend/src/pages/admin/` — AdminPanel, Products, Categories, ProductModal, CategoryModal, ProductSearch, Product, Header
- `frontend/src/pages/admin/components/services/` — productService.ts, categoryService.ts
- React Router v7 routing, Tailwind CSS 3, TypeScript, Vite

### Missing
- Authentication & authorization (no JWT, no users)
- Customer storefront (homepage, catalog, product detail)
- Shopping cart
- Checkout & payment
- Orders system
- User accounts
- Spanish language / i18n
- SEO foundations
- Email notifications

---

## Architecture Decisions

- **Auth:** JWT (access + refresh tokens) stored in HttpOnly cookies — no localStorage for security
- **i18n:** `react-i18next` with ES (default) + RU (toggle), `hreflang` tags for SEO
- **State:** RTK slices for cart, auth, UI; RTK Query for server data
- **Store:** Move services from inline fetch calls → RTK Query endpoints in `frontend/src/services/baseApi.ts`
- **Routing:** Customer-facing routes at `/`, admin routes at `/admin` (protected)
- **Images:** Continue local static file serving in dev; design for CDN-ready paths
- **Payments:** Stripe integration (card) + Cash on Delivery flag on order

---

## Phase 1 — Foundation & Auth (Backend Priority)

**Goal:** Secure backend, user model, JWT auth, guard admin routes.

### 1.1 User Model & Schema
- File: `backend/app/models.py`
- Add `User` model: `id`, `email` (unique), `hashed_password`, `full_name`, `phone`, `role` (enum: `customer`, `admin`), `is_active`, `created_at`, `loyalty_points` (Integer, default 0)
- Alembic migration: `alembic revision --autogenerate -m "add_users_table"`

### 1.2 Auth Core
- File: `backend/app/core/security.py`
  - `hash_password(plain)` → bcrypt hash
  - `verify_password(plain, hashed)` → bool
  - `create_access_token(data, expires_delta)` → JWT string
  - `create_refresh_token(data)` → JWT string
- File: `backend/app/core/dependencies.py`
  - `get_db()` — async session dependency (move from database.py)
  - `get_current_user(token)` — decode JWT, return User or 401
  - `require_admin(user)` — raise 403 if not admin

### 1.3 Auth Router & Service
- File: `backend/app/routers/auth.py`
  - `POST /auth/register` — create customer account
  - `POST /auth/login` — return access + refresh tokens (HttpOnly cookies)
  - `POST /auth/logout` — clear cookies
  - `POST /auth/refresh` — rotate access token
  - `GET /auth/me` — return current user profile
- File: `backend/app/services/auth_service.py`
  - `register_user(db, data)`, `authenticate_user(db, email, password)`, `get_user_by_email(db, email)`

### 1.4 Protect Admin Routes
- Apply `Depends(require_admin)` to all routers under `admin_routes/`
- Add `Depends(require_admin)` to main.py router inclusion

### 1.5 Frontend Auth Shell
- Files: `frontend/src/features/auth/`
  - `slice.ts` — RTK slice: `{ user, isAuthenticated, isLoading }`
  - `api.ts` — RTK Query: `login`, `logout`, `register`, `getMe`
  - `components/LoginModal.tsx` — login form
  - `components/RegisterModal.tsx` — register form
- Protect `/admin` route in `frontend/src/app/router.tsx` with auth guard

---

## Phase 2 — Customer Storefront

**Goal:** Public-facing pages users land on. This is the highest-impact work per research.

### 2.0 Category Hierarchy (prerequisite — implement before 2.1 and 2.2)

The storefront uses a **two-level category system** with three distinct category types:

| Type | `is_super` | `parent_id` | Image | Background color |
|---|---|---|---|---|
| Super category | `true` | `null` | No | No |
| Sub-category (child) | `false` | `<id>` | Optional (drag-and-drop) | Yes (hex picker) |
| Standalone category | `false` | `null` | No | No |

Planned super categories: **Supermarket, Cuisine, Frozen, Dairy, Others**

A sub-category can exist independently without a parent (standalone). Standalone categories appear in the catalog filter sidebar but not in the homepage super-category sections.

#### Backend — `Category` model changes (`backend/app/models.py`)

Add five columns to `Category`:
- `parent_id` — `Integer`, nullable FK → `categories.id` (self-referential). Null for super and standalone.
- `is_super` — `Boolean`, default `False`. Distinguishes super categories from standalone (both have `parent_id=null`).
- `image_url` — `String(512)`, nullable. Only set for sub-categories (child). 1 image per category.
- `background_color` — `String(7)`, nullable. Hex color (e.g. `#FFE4C4`). Only relevant for sub-categories with a parent; shown as the card background on the homepage.
- `sort_order` — `Integer`, default `0`. Controls display order within a parent group.

Add relationships:
```python
children = relationship("Category", back_populates="parent", foreign_keys=[parent_id])
parent   = relationship("Category", back_populates="children", remote_side=[id])
```

API-level constraint: `parent_id` must point to a category with `is_super=True`. Max depth = 2 (no grandchildren). Enforced in the service layer.

Alembic migration: `alembic revision --autogenerate -m "add_category_hierarchy"`

#### Backend — `config.py`

Add `category_images_dir: str = "static/categories"` with `mkdir` validator (same pattern as `product_images_dir`).

#### Backend — new & changed API endpoints

- `GET /categories/tree` *(new)* — returns super categories (`is_super=True`) each with a `children` array of their sub-categories. Used by the homepage sections.
  ```json
  [
    { "id": 1, "name": "Cuisine", "sort_order": 0,
      "children": [
        { "id": 4, "name": "Baking", "image_url": "/static/categories/baking.webp", "background_color": "#FFF3E0" },
        ...
      ]
    }
  ]
  ```
- `GET /categories` *(existing, flat)* — keep unchanged. Admin panel depends on it.
- `GET /products` *(extend)* — add `super_category_id` query param. When provided, the product service queries all categories where `parent_id = super_category_id` and returns products belonging to any of them.
- `POST /admin/categories/{id}/image` *(new)* — same drag-and-drop multipart upload as product images. Saves to `static/categories/`, stores URL in `category.image_url`. Replaces the existing image if one is already set (1 image per category).
- `DELETE /admin/categories/{id}/image` *(new)* — deletes the file and clears `image_url`.

#### Frontend — homepage super-category sections

Replace the current flat 6-card category grid with a **sectioned layout** (data source: `GET /categories/tree`):
- One `<section>` per super category
- Section heading (bold, brand-navy) + "Ver todo →" link → `/catalog?super=<id>`
- Horizontal grid of sub-category cards below the heading
- Each card: rounded corners, `background_color` as card background, food image centered, sub-category name below
- Each card links to `/catalog?category=<id>`

#### Frontend — catalog sidebar

Replace flat category checkbox list with a **two-level grouped tree**:
- Super category name as a bold, non-clickable group label
- Sub-category names as checkboxes beneath it
- Standalone categories (no parent) appear after all super-category groups, ungrouped
- Selecting a sub-category adds `?category=<id>` to the URL
- Selecting a super category label (clicking "Ver todo" shortcut) adds `?super=<id>` and selects all its children

#### Frontend — admin category form

Extend the existing category create/edit modal:
- Add **"Parent category"** dropdown (shows only `is_super=True` categories; optional — leave blank for standalone)
- Add **"Is super category"** toggle (marks this as a top-level section; disables parent dropdown when on)
- Add **background color** hex picker (only shown when a parent is selected)
- Add **image upload area** (drag-and-drop, same component as product images; only shown when a parent is selected)
- Category list table: show a visual tag (Super / Sub / Standalone) in the type column

---

### 2.1 Homepage (`/`)
- File: `frontend/src/pages/HomePage.tsx`
- Sections (in order):
  1. **Hero** — Headline: *"Los sabores de casa, entregados mañana."* + Subhead + "Comprar ahora" CTA + free shipping badge
  2. **Trust Bar** — 4 icons: "Envío 24h" / "Contra reembolso" / "3.000+ productos" / "Puntos de fidelidad"
  3. **Super Category Sections** — One labeled section per super category (from `GET /categories/tree`). Each section shows sub-category cards with image + background color. Includes "Ver todo →" link → `/catalog?super=<id>`. See section 2.0 for card layout.
  4. **Best Sellers** — 12 product cards (fetch `GET /products?page_size=12&is_active=true`, sorted by name for now)
  5. **Brand Story** — 2-column: emotional text + food photo
  6. **Testimonials** — 3 hardcoded cards (until reviews system exists)
  7. **Weekly Offers** — Products with `has_discount=true` (fetch `GET /products?has_discount=true&page_size=6`)
  8. **Footer** — categories, delivery zones, contact, language toggle, social links

### 2.2 Catalog Page (`/catalog`)
- File: `frontend/src/pages/CatalogPage.tsx`
- Features:
  - Sidebar: two-level category tree (super category labels + sub-category checkboxes + standalone categories; see 2.0), price range slider, in-stock toggle, discount toggle
  - Top bar: search input, sort dropdown (price asc/desc, name), page size selector
  - Product grid (3–4 col responsive), pagination
  - URL-synced filters (`?category=1&q=herring&page=2`; also `?super=1` to load all products under all sub-categories of a super category)
  - `?super=<id>` resolved on the backend via `super_category_id` query param — fetches all products in any child category of that super category

### 2.3 Product Detail Page (`/product/:id`)
- File: `frontend/src/pages/ProductDetailPage.tsx`
- Sections:
  - Image gallery (main image + thumbnails)
  - Product info: name, bar code, current price, original price (if discount), stock badge, categories
  - "Añadir al carrito" button (quantity selector)
  - Description tab
  - Related products (same category, 4 cards)
- Backend: Add `GET /products/{product_id}` endpoint (single product by ID)

### 2.4 Product Card Component
- File: `frontend/src/components/ui/ProductCard.tsx`
- Reused across Homepage (best sellers, offers) and Catalog
- Props: product object, onAddToCart handler
- Shows: image, name, current price, original price (strikethrough if discounted), discount badge, "Añadir" button

### 2.5 Visual Identity Implementation
- Extend `frontend/tailwind.config.ts` with brand palette:
  - `baltic-navy: '#1C3557'` (primary)
  - `amber: '#D4572A'` (accent/CTA)
  - `warm-paper: '#F8F5F0'` (background)
  - `trust-green: '#2C7A4B'` (badges)
- Global font: Playfair Display (headings) + Inter (body) via Google Fonts in `frontend/src/styles/globals.css`

---

## Phase 3 — Shopping Cart

**Goal:** Client-side cart with persistent state, synced to UI.

### 3.1 Cart State (Redux)
- File: `frontend/src/features/cart/slice.ts`
- State: `{ items: CartItem[], isOpen: boolean }`
- `CartItem`: `{ productId, name, price, imageUrl, quantity, maxStock }`
- Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- Persist to `localStorage` with `redux-persist`

### 3.2 Cart UI
- File: `frontend/src/features/cart/components/CartDrawer.tsx` — slide-in panel from right
- File: `frontend/src/features/cart/components/CartItem.tsx` — item row with qty controls + remove
- File: `frontend/src/components/layout/Header.tsx` — top nav with cart icon (badge count), language toggle, search bar
- Cart opens on "Añadir al carrito" click anywhere on site

### 3.3 Cart Summary
- Subtotal calculation
- Free shipping threshold message: "Te faltan €X para envío gratis"
- "Ir al pago" CTA → `/checkout`

---

## Phase 4 — Checkout & Orders

**Goal:** End-to-end order creation and tracking.

### 4.1 Order Model
- File: `backend/app/models.py` — add:
  - `Order`: `id`, `user_id` (FK, nullable for guest), `status` (enum: pending/confirmed/shipped/delivered/cancelled), `total_amount` (Numeric), `delivery_address` (JSON), `payment_method` (enum: card/cash), `created_at`, `notes`
  - `OrderItem`: `id`, `order_id` (FK), `product_id` (FK), `quantity`, `unit_price` (Numeric snapshot)
- Alembic migration

### 4.2 Order Router & Service
- File: `backend/app/routers/orders.py`
  - `POST /orders` — create order (requires auth OR guest email), decrements stock
  - `GET /orders/me` — list user's orders
  - `GET /orders/{order_id}` — order detail (owner or admin)
- File: `backend/app/admin_routes/orders.py`
  - `GET /admin/orders` — list all orders with filters (status, date range, user)
  - `PATCH /admin/orders/{order_id}/status` — update status
- File: `backend/app/services/order_service.py`
  - `create_order(db, user_id, cart_items, address, payment_method)` — atomic: create order + items + decrement stock

### 4.3 Checkout Page
- File: `frontend/src/pages/CheckoutPage.tsx`
- Steps (single page, step indicators):
  1. Delivery address form (name, phone, street, city, province, postal code)
  2. Payment method: card (Stripe Elements) or cash on delivery
  3. Order summary + "Confirmar pedido" button
- On success → `/order-confirmed/:orderId`

### 4.4 Stripe Integration
- Backend: `POST /payments/create-intent` → returns `client_secret`
- Frontend: `@stripe/stripe-js` + `@stripe/react-stripe-js`
- Env vars: `STRIPE_SECRET_KEY` (backend), `VITE_STRIPE_PUBLIC_KEY` (frontend)

### 4.5 Order Confirmation & History
- File: `frontend/src/pages/OrderConfirmedPage.tsx` — success screen with order ID
- File: `frontend/src/pages/AccountPage.tsx` — tabs: Profile, Order History, Loyalty Points

---

## Phase 5 — Admin Enhancements

**Goal:** Complete the admin panel with orders management and user management.

### 5.1 Admin Orders Section
- File: `frontend/src/pages/admin/components/Orders.tsx` (currently empty placeholder)
- Features:
  - Order list with filters: status, date range, search by ID/email
  - Order detail view with items, address, payment method
  - Status update dropdown (pending → confirmed → shipped → delivered)
  - Total revenue aggregation in header stats card

### 5.2 Admin Users Section
- File: `frontend/src/pages/admin/components/Users.tsx` (currently empty placeholder)
- Features:
  - User list with search by email/name
  - User detail: profile info, order history, loyalty points
  - Toggle user active status
  - Manually adjust loyalty points

### 5.3 Admin Dashboard (new)
- File: `frontend/src/pages/admin/components/Dashboard.tsx`
- Widgets:
  - Total orders today / this week / this month
  - Revenue today / this week
  - Top selling products (last 30 days)
  - Low stock alerts (stock < 10)
  - Orders by status pie chart

### 5.4 Settings Page
- File: `frontend/src/pages/admin/components/Settings.tsx`
- Config: store name, delivery fee, free shipping threshold per province, WhatsApp number, contact email

---

## Phase 6 — SEO, i18n & Performance

**Goal:** Make the site visible on Spanish Google and multilingual.

### 6.1 Internationalization
- Add `react-i18next` to frontend
- Create `frontend/src/locales/es.json` and `frontend/src/locales/ru.json`
- Language toggle component in Header (ES / RU)
- Default language: Spanish (ES)
- Store preference in `localStorage`

### 6.2 SEO
- React Router's `<head>` management via `react-helmet-async`
- Page-level: `<title>`, `<meta name="description">`, `<link rel="canonical">`, `<link rel="alternate" hreflang>`
- Homepage meta: "Tienda de productos del Este de Europa en España | Baltika"
- Catalog meta per category
- Product meta: product name + price

### 6.3 Performance
- React `lazy()` + `Suspense` for route-level code splitting
- Image lazy loading (`loading="lazy"`)
- RTK Query cache tuning (stale-while-revalidate)

---

## Phase 7 — Email Notifications

### 7.1 Backend
- Add `fastapi-mail` package
- Env vars: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`
- Trigger on: order created (customer + admin), order status change (customer)
- File: `backend/app/services/email_service.py`

### 7.2 Email Templates
- `order_confirmation.html` — order summary with items list
- `order_status_update.html` — new status, estimated delivery

---

## File Map (Critical Files)

| Area | File |
|---|---|
| User model | `backend/app/models.py` |
| Order + OrderItem models | `backend/app/models.py` |
| Category hierarchy (parent_id, is_super, image_url, background_color, sort_order) | `backend/app/models.py` |
| Auth security utils | `backend/app/core/security.py` |
| Auth dependencies | `backend/app/core/dependencies.py` |
| Auth router | `backend/app/routers/auth.py` |
| Auth service | `backend/app/services/auth_service.py` |
| Category tree endpoint + image upload | `backend/app/routers/admin/categories.py` + `backend/app/routers/storefront.py` |
| Category service (tree query, super_category_id filter) | `backend/app/services/category_service.py` |
| Category static images dir | `backend/static/categories/` |
| Order router (customer) | `backend/app/routers/orders.py` |
| Order router (admin) | `backend/app/admin_routes/orders.py` |
| Order service | `backend/app/services/order_service.py` |
| Tailwind config (brand colors) | `frontend/tailwind.config.ts` |
| Global styles + fonts | `frontend/src/styles/globals.css` |
| Router (add new routes) | `frontend/src/app/router.tsx` (create) |
| Redux store | `frontend/src/store/index.ts` (create) |
| RTK Query base API | `frontend/src/services/baseApi.ts` (create) |
| Auth slice | `frontend/src/features/auth/slice.ts` |
| Cart slice | `frontend/src/features/cart/slice.ts` |
| HomePage (super category sections) | `frontend/src/pages/HomePage.tsx` |
| CatalogPage (two-level sidebar) | `frontend/src/pages/CatalogPage.tsx` |
| ProductDetailPage | `frontend/src/pages/ProductDetailPage.tsx` |
| CheckoutPage | `frontend/src/pages/CheckoutPage.tsx` |
| AccountPage | `frontend/src/pages/AccountPage.tsx` |
| Header (customer nav) | `frontend/src/components/layout/Header.tsx` |
| ProductCard | `frontend/src/components/ui/ProductCard.tsx` |
| CartDrawer | `frontend/src/features/cart/components/CartDrawer.tsx` |
| Admin Orders | `frontend/src/pages/admin/components/Orders.tsx` |
| Admin Users | `frontend/src/pages/admin/components/Users.tsx` |
| Admin Dashboard | `frontend/src/pages/admin/components/Dashboard.tsx` |
| i18n locales | `frontend/src/locales/es.json`, `ru.json` |
| Email service | `backend/app/services/email_service.py` |

---

## Implementation Order (Priority)

1. **Phase 1** — Auth (blocking: no admin protection without it)
2. **Phase 2** — Customer Storefront homepage + catalog + product detail (highest business impact)
3. **Phase 3** — Cart (prerequisite for checkout)
4. **Phase 4** — Checkout + Orders (completes the purchase flow)
5. **Phase 5** — Admin Enhancements (orders management, users management)
6. **Phase 6** — i18n + SEO (Spanish language for market reach)
7. **Phase 7** — Email Notifications

---

## Verification Checklist (per phase)

- **Phase 1:** Register a user, login, confirm JWT cookie set, hit a protected admin route without token (expect 401), with token (expect 200)
- **Phase 2:** Visit `/` — see hero, categories, products; visit `/catalog` — filter by category, search by name, paginate; visit `/product/1` — see gallery, price, add-to-cart button
- **Phase 3:** Add 3 items, open cart drawer, change quantity, remove item, verify subtotal math; reload page, verify cart persists
- **Phase 4:** Complete checkout, verify order in DB, verify stock decremented, visit `/order-confirmed/:id`
- **Phase 5:** In admin, change order status, verify badge updates; search user, adjust loyalty points
- **Phase 6:** Open Network tab — confirm page language = ES; toggle RU — all text changes; inspect `<head>` for canonical + hreflang tags
- **Phase 7:** Place test order — confirm email arrives at customer address within 60s

---

## Notes

- Keep `aiosqlite` as secondary DB fallback (already configured in codebase) — useful for local dev without Postgres
- `docker-compose.yml` already exists — add a `redis` service when session/rate-limiting is needed in Phase 1
- Admin routes currently at `backend/app/admin_routes/` — keep this separation clean; customer-facing endpoints go in `backend/app/routers/`
