# Phase 2 — Customer Storefront

Figma design - https://www.figma.com/design/B5WQmh33f5kuUcKeMn6fWp/Интернет-магазин---Продуктов?node-id=549-7973

## Context

Phase 1 is complete: JWT auth, User model, admin CRUD (products, categories, images) all working.
Phase 2 builds the public customer-facing storefront following the Figma design (mobile-first,
Russian grocery-store UX pattern) with Baltika brand colors from plan.md. The Figma shows two
key pages — Homepage and Catalog — that define the shared component language for the whole storefront.

**Design decisions locked in:**

- Layout/UX: Figma (bottom nav, category pills, hero carousel, 2-col product grid)
- Brand colors: plan.md palette (baltic-navy, amber, warm-paper)
- Approach: mobile-first with Tailwind responsive prefixes

---

## What's Missing Right Now

1. **No public API** — `/products` and `/categories` require admin auth; customers can't fetch anything
2. **No storefront routes** — router only has `/categories` (broken, hits admin endpoint) and `/admin`
3. **No shared layout** — no Header, BottomNav, or CategoryPills components
4. **No product card** — reusable card component doesn't exist
5. **No cart state** — needed for "В корзину" buttons on product cards

---

## 1. Backend — Public Storefront Router

**New file:** `backend/app/routers/storefront.py`

Three public (no auth) endpoints that reuse the existing `ProductService`:

| Method | Path                   | Params                                                                                                 | Notes                                                           |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| GET    | `/store/categories`    | —                                                                                                      | All categories, ordered by id                                   |
| GET    | `/store/products`      | `q`, `category_id`, `has_discount`, `page`, `page_size`, `sort` (`popular`\|`price_asc`\|`price_desc`) | Forces `is_active=True`; reuses `ProductService.get_products()` |
| GET    | `/store/products/{id}` | —                                                                                                      | Single active product; 404 if not found or inactive             |

**Register in `backend/main.py`** — no `Depends(require_admin)`:

```python
from app.routers import storefront
app.include_router(storefront.router, prefix="/store", tags=["storefront"])
```

**Reuse:** `ProductService.get_products()` in `backend/app/services/product_service.py` already supports all filters. Just pass `is_active=True` always.

---

## 2. Tailwind — Brand Colors & Fonts

**File to modify:** `frontend/tailwind.config.ts`

```ts
colors: {
  'baltic-navy':  '#1C3557',  // primary — buttons, header bg, nav
  'amber':        '#D4572A',  // accent — prices, CTAs, "В корзину"
  'warm-paper':   '#F8F5F0',  // page background
  'trust-green':  '#2C7A4B',  // in-stock badge
  'card-bg':      '#FFFFFF',  // product card background
}
```

**File to modify:** `frontend/src/index.css`

- Import Playfair Display (headings) + Inter (body) via Google Fonts
- Set `font-family` defaults

---

## 3. RTK Query — Storefront API

**New file:** `frontend/src/features/storefront/api.ts`

RTK Query `createApi` (separate from `authApi`):

- `getCategories`: `GET /store/categories` → `Category[]`
- `getProducts`: `GET /store/products?{params}` → `ProductListResponse`
- `getProduct`: `GET /store/products/{id}` → `ProductRead`

Cache: 60s for categories (rarely change), 30s for products.

**New file:** `frontend/src/features/storefront/types.ts`

- Re-export or copy `Product`, `Category`, `ProductListResponse` types (public versions don't need admin fields)

**Modify:** `frontend/src/store/index.ts` — add `storefrontApi` reducer + middleware

---

## 4. Shared Layout Components

### 4.1 Header

**New file:** `frontend/src/components/layout/Header.tsx`

```
[ ≡ ]  [ Baltika logo ]  [ city badge ]  [ 🔍 ]
```

- Hamburger icon (left) — opens future side drawer
- Logo text "Балтика" in brand font (baltic-navy color)
- City badge pill (amber bg) — hardcoded "ESP" for now
- Search button (amber bg, icon only) — navigates to `/catalog?q=`
- Sticky top, white bg, shadow-sm

### 4.2 CategoryPills

**New file:** `frontend/src/components/layout/CategoryPills.tsx`

- Horizontal scroll (`overflow-x-auto`, hide scrollbar)
- One pill per category from `useGetCategoriesQuery()`
- Active pill: `bg-amber text-white`; inactive: `bg-white border text-gray-700`
- Click → navigate to `/catalog?category={id}`
- Highlight active based on current URL search param

### 4.3 BottomNav

**New file:** `frontend/src/components/layout/BottomNav.tsx`

Fixed 5-tab bar at bottom:

```
[ Каталог ]  [ Акции ]  [ 🛒 Cart ]  [ Избранное ]  [ Профиль ]
```

- Center cart button: large pill, `bg-amber text-white`, shows total item count badge
- Active tab: `text-amber`; inactive: `text-gray-400`
- `fixed bottom-0 w-full z-50 bg-white border-t`
- Cart button dispatches open drawer (Phase 3); for now shows item count from cart slice

### 4.4 PageWrapper

**New file:** `frontend/src/components/layout/PageWrapper.tsx`

- Renders `<Header />` + `<CategoryPills />` + `{children}` + `<BottomNav />`
- Adds `pb-20` (bottom padding so content doesn't hide behind BottomNav)
- `bg-warm-paper min-h-screen`

---

## 5. Reusable UI Components

### 5.1 ProductCard

**New file:** `frontend/src/components/ui/ProductCard.tsx`

Props: `product: Product`, `onAddToCart: (product) => void`

Layout (2-col grid card):

```
┌─────────────────────┐
│  [product image]    │ ← aspect-square, object-cover
│               ♡     │ ← heart icon top-right (wishlist, Phase 5)
├─────────────────────┤
│ В наличии X шт  $   │ ← small gray text + original price
│ Product name        │ ← 2 lines max, font-medium
│ 299,90 €    [В кор] │ ← price in amber, button amber pill
│ ~~469,00 €~~        │ ← strikethrough if has_discount
└─────────────────────┘
```

- Uses `product.current_price` (computed by backend)
- Discount badge: absolute top-left amber pill with `-%`
- "В корзину" button calls `onAddToCart(product)` → dispatches to cart slice

### 5.2 SectionHeader

**New file:** `frontend/src/components/ui/SectionHeader.tsx`

Props: `title: string`, `linkTo?: string`, `linkLabel?: string`

```
СКИДКИ    [ Смотреть все > ]
```

### 5.3 HeroBanner

**New file:** `frontend/src/components/ui/HeroBanner.tsx`

- Array of banner slide objects (hardcoded for Phase 2 — no CMS yet)
- Auto-play carousel (3s interval), swipeable on mobile
- Dot indicators below
- Each slide: bg gradient, food image, headline, subheading, CTA button
- Phase 2: 2-3 hardcoded slides (Baltic foods theme)

---

## 6. Cart Slice (Minimal — Phase 2 prerequisite)

**New file:** `frontend/src/features/cart/slice.ts`

```ts
interface CartItem {
  productId: number;
  name: string;
  price: number; // current_price at time of add
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}
```

Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `openCart`, `closeCart`

Persist to `localStorage` with `redux-persist`. Full cart UI (CartDrawer) is Phase 3.

**Modify:** `frontend/src/store/index.ts` — add cart reducer + `redux-persist` setup

**Package:** `pnpm add redux-persist`

---

## 7. Pages

### 7.1 HomePage (`/`)

**New file:** `frontend/src/pages/HomePage.tsx`

Sections in order:

1. `<HeroBanner />` — 2-3 hardcoded slides
2. `<PromoBanners />` (inline, 2-col) — 2 hardcoded promo cards (cashback, loyalty)
3. `<SectionHeader title="СКИДКИ" linkTo="/catalog?has_discount=true" />` + product grid
   → `useGetProductsQuery({ has_discount: true, page_size: 6 })`
4. `<SectionHeader title="ХИТ ПРОДАЖ" linkTo="/catalog" />` + product grid
   → `useGetProductsQuery({ page_size: 8 })`

### 7.2 CatalogPage (`/catalog`)

**New file:** `frontend/src/pages/CatalogPage.tsx`

- Reads URL params: `?category=`, `?q=`, `?has_discount=`, `?sort=`, `?page=`
- Breadcrumb: Главная / Каталог / {categoryName if filtered}
- Page title: category name or "Каталог"
- Filter bar:
  - "≡ Категории" button → opens bottom sheet with category checkboxes
  - Sort pill: По популярности / Цена ↑ / Цена ↓
- 2-col product grid via `useGetProductsQuery(params)`
- Load More button (appends next page) — not paginator
- URL updates on filter change (via `useSearchParams`)

### 7.3 ProductDetailPage (`/product/:id`)

**New file:** `frontend/src/pages/ProductDetailPage.tsx`

- `useGetProductQuery(id)`
- Large product image (or placeholder if none)
- Stock badge (green "В наличии" or red "Нет в наличии")
- Name, categories tags
- Current price (amber, large) + original price strikethrough (if discounted)
- Quantity selector + "В корзину" button
- Description section
- Related products: `useGetProductsQuery({ category_id: firstCategory, page_size: 4 })` — horizontal scroll

---

## 8. Router Updates

**Modify:** `frontend/src/app/router.tsx`

```
/                    → HomePage
/catalog             → CatalogPage
/product/:id         → ProductDetailPage
/admin/*             → AdminPanel (AdminGuard, unchanged)
```

Remove the old `/categories` redirect and `CategoriesPage`.

---

## Implementation Order

1. `backend/app/routers/storefront.py` + register in `main.py`
2. `tailwind.config.ts` brand colors + font imports in `index.css`
3. `frontend/src/features/storefront/api.ts` (RTK Query)
4. `frontend/src/features/cart/slice.ts` + redux-persist setup
5. `frontend/src/components/layout/` — Header, CategoryPills, BottomNav, PageWrapper
6. `frontend/src/components/ui/` — ProductCard, SectionHeader, HeroBanner
7. `frontend/src/pages/HomePage.tsx`
8. `frontend/src/pages/CatalogPage.tsx`
9. `frontend/src/pages/ProductDetailPage.tsx`
10. `frontend/src/app/router.tsx` — update routes

---

## Critical Files

| What changes    | File                                                          |
| --------------- | ------------------------------------------------------------- |
| New public API  | `backend/app/routers/storefront.py`                           |
| Register router | `backend/main.py`                                             |
| Reused service  | `backend/app/services/product_service.py` (no changes needed) |
| Brand colors    | `frontend/tailwind.config.ts`                                 |
| Global fonts    | `frontend/src/index.css`                                      |
| RTK Query API   | `frontend/src/features/storefront/api.ts`                     |
| Cart state      | `frontend/src/features/cart/slice.ts`                         |
| Redux store     | `frontend/src/store/index.ts`                                 |
| Header          | `frontend/src/components/layout/Header.tsx`                   |
| BottomNav       | `frontend/src/components/layout/BottomNav.tsx`                |
| CategoryPills   | `frontend/src/components/layout/CategoryPills.tsx`            |
| PageWrapper     | `frontend/src/components/layout/PageWrapper.tsx`              |
| ProductCard     | `frontend/src/components/ui/ProductCard.tsx`                  |
| HeroBanner      | `frontend/src/components/ui/HeroBanner.tsx`                   |
| SectionHeader   | `frontend/src/components/ui/SectionHeader.tsx`                |
| Homepage        | `frontend/src/pages/HomePage.tsx`                             |
| Catalog         | `frontend/src/pages/CatalogPage.tsx`                          |
| Product detail  | `frontend/src/pages/ProductDetailPage.tsx`                    |
| Router          | `frontend/src/app/router.tsx`                                 |

---

## Verification

1. **Backend:** `GET /store/products?has_discount=true&page_size=6` returns active discounted products without auth cookie
2. **Homepage:** Visit `/` — see hero banner with dots, promo cards row, discount section, best sellers
3. **Category pills:** Click a category → URL updates to `/catalog?category=X` → products filter
4. **Catalog:** Visit `/catalog` — see breadcrumb, filter bar, 2-col product grid, sort works
5. **Product detail:** Click a product card → navigate to `/product/:id` → see image, price, "В корзину" button
6. **Add to cart:** Click "В корзину" → BottomNav cart button shows count badge
7. **Cart persists:** Reload page → cart items still in BottomNav count (redux-persist)
8. **Mobile:** Test at 375px width — all layouts look correct, bottom nav is fixed
9. **Admin unchanged:** `/admin` still requires login, admin CRUD still works
