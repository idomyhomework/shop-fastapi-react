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
- Category system: two-level hierarchy (super categories → sub-categories) with standalone support

---

## What's Missing Right Now

1. **No public API** — `/products` and `/categories` require admin auth; customers can't fetch anything
2. **No storefront routes** — router only has `/categories` (broken, hits admin endpoint) and `/admin`
3. **No shared layout** — no Header, BottomNav, or CategoryPills components
4. **No product card** — reusable card component doesn't exist
5. **No cart state** — needed for "В корзину" buttons on product cards
6. **No category hierarchy** — `Category` model is flat; no super/sub structure, no images, no background colors

---

## 0. Category Hierarchy (implement first — blocks homepage and catalog)

### 0.1 Category types

Three distinct category types coexist in the same table:

| Type                 | `is_super` | `parent_id` | Image              | Background color |
| -------------------- | ---------- | ----------- | ------------------ | ---------------- |
| Super category       | `true`     | `null`      | No                 | No               |
| Sub-category (child) | `false`    | `<id>`      | Optional (1 image) | Yes (hex)        |
| Standalone           | `false`    | `null`      | No                 | No               |

Planned super categories: **Supermarket, Cuisine, Frozen, Dairy, Others**

Sub-categories appear under a super category on the homepage. Standalone categories appear only in the catalog sidebar, ungrouped.

### 0.2 Backend — `Category` model (`backend/app/models.py`)

Add five columns:

```python
# ── Category hierarchy ─────────────────────────────────────────────────────
parent_id        = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
is_super         = Column(Boolean, nullable=False, default=False)
image_url        = Column(String(512), nullable=True)          # sub-categories only
background_color = Column(String(7), nullable=True)            # e.g. "#FFE4C4"
sort_order       = Column(Integer, nullable=False, default=0)

# ── Relationships ──────────────────────────────────────────────────────────
children = relationship("Category", back_populates="parent", foreign_keys=[parent_id])
parent   = relationship("Category", back_populates="children", remote_side=[id])
```

Service-layer constraint: `parent_id` must point to a category with `is_super=True`. Max depth = 2.

Alembic migration: `alembic revision --autogenerate -m "add_category_hierarchy"`

### 0.3 Backend — `config.py`

Add `category_images_dir: str = "static/categories"` with the same `mkdir` validator used by `product_images_dir`. Images saved to `backend/static/categories/`, served at `/static/categories/<filename>`.

### 0.4 Backend — updated schemas (`backend/app/schemas.py`)

Add new Pydantic schemas:

- `CategoryChild` — `{ id, name, image_url, background_color, sort_order }`
- `CategoryTree` — `{ id, name, sort_order, children: list[CategoryChild] }`
- Update `CategoryRead` / `CategoryCreate` / `CategoryUpdate` with the five new fields

### 0.5 Backend — new & changed endpoints

**Storefront (public, no auth):**

| Method | Path                     | Notes                                                                                         |
| ------ | ------------------------ | --------------------------------------------------------------------------------------------- |
| GET    | `/store/categories/tree` | Returns super categories with their `children` array. Used by homepage sections.              |
| GET    | `/store/categories`      | Flat list (unchanged). Used by CategoryPills.                                                 |
| GET    | `/store/products`        | Add `super_category_id` param — fetches all products in any child category of that super cat. |

`/store/categories/tree` response shape:

```json
[
  {
    "id": 1,
    "name": "Cuisine",
    "sort_order": 0,
    "children": [
      {
        "id": 4,
        "name": "Baking",
        "image_url": "/static/categories/baking.webp",
        "background_color": "#FFF3E0",
        "sort_order": 0
      }
    ]
  }
]
```

**Admin (requires `require_admin`):**

| Method | Path                           | Notes                                                                                       |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------- |
| POST   | `/admin/categories/{id}/image` | Multipart upload, saves to `static/categories/`, sets `image_url`. Replaces existing image. |
| DELETE | `/admin/categories/{id}/image` | Deletes file from disk, clears `image_url`.                                                 |

`super_category_id` query on `/store/products`: product service fetches all `category_id`s where `parent_id = super_category_id`, then returns products belonging to any of them.

### 0.6 Frontend — admin category form updates

**Modify:** existing category create/edit modal in `frontend/src/pages/admin/`

- Add **"Is super category"** toggle — when ON, disables parent dropdown
- Add **"Parent category"** dropdown — shows only `is_super=True` categories; optional (blank = standalone)
- Add **background color** hex picker — only shown when a parent is selected
- Add **image upload area** — drag-and-drop (same component as product images); only shown when a parent is selected; 1 image per category; replaces existing on re-upload
- Category list table: add a type tag column (Super / Sub / Standalone)

---

## 1. Backend — Public Storefront Router

**New file:** `backend/app/routers/storefront.py`

All endpoints are public (no auth). Full endpoint list including hierarchy additions:

| Method | Path                     | Params                                                                                                                      | Notes                                                               |
| ------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/store/categories`      | —                                                                                                                           | All categories, ordered by `sort_order`, `id`. Flat list for pills. |
| GET    | `/store/categories/tree` | —                                                                                                                           | Super categories + children. For homepage sections.                 |
| GET    | `/store/products`        | `q`, `category_id`, `super_category_id`, `has_discount`, `page`, `page_size`, `sort` (`popular`\|`price_asc`\|`price_desc`) | Forces `is_active=True`                                             |
| GET    | `/store/products/{id}`   | —                                                                                                                           | Single active product; 404 if not found or inactive                 |

**Register in `backend/main.py`** — no `Depends(require_admin)`:

```python
from app.routers import storefront
app.include_router(storefront.router, prefix="/store", tags=["storefront"])
```

**Reuse:** `ProductService.get_products()` already supports all existing filters. Extend it to accept `super_category_id`.

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

- `getCategories`: `GET /store/categories` → `Category[]` — for CategoryPills
- `getCategoriesTree`: `GET /store/categories/tree` → `CategoryTree[]` — for homepage sections
- `getProducts`: `GET /store/products?{params}` → `ProductListResponse` — accepts `super_category_id`
- `getProduct`: `GET /store/products/{id}` → `ProductRead`

Cache: 60s for categories (rarely change), 30s for products.

**New file:** `frontend/src/features/storefront/types.ts`

```ts
// ── Category types ─────────────────────────────────────────────────────────
interface CategoryChild {
  id: number;
  name: string;
  image_url: string | null;
  background_color: string | null;
  sort_order: number;
}

interface CategoryTree {
  id: number;
  name: string;
  sort_order: number;
  children: CategoryChild[];
}

interface Category {
  id: number;
  name: string;
  is_super: boolean;
  parent_id: number | null;
  sort_order: number;
}
```

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
- One pill per **super category** from `useGetCategoriesQuery()` (filter `is_super=true` client-side)
- Active pill: `bg-amber text-white`; inactive: `bg-white border text-gray-700`
- Click → navigate to `/catalog?super={id}` (shows all products under that super category)
- Highlight active pill based on current `?super=` URL param

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

### 5.2 SubCategoryCard

**New file:** `frontend/src/components/ui/SubCategoryCard.tsx`

Props: `category: CategoryChild`

```
┌─────────────────────┐  ← background_color as card bg (e.g. #FFF3E0)
│                     │
│   [category image]  │  ← centered, object-contain
│                     │
│   Baking            │  ← category name, bottom-left, font-medium
└─────────────────────┘
```

- Rounded corners (`rounded-2xl`)
- `background_color` applied as inline `style={{ backgroundColor }}`; falls back to `#F5F5F5` if null
- Image is optional — if no `image_url`, show a colored card with name only
- Click → navigate to `/catalog?category={id}`
- Used exclusively in the homepage super-category sections

### 5.3 SectionHeader

**New file:** `frontend/src/components/ui/SectionHeader.tsx`

Props: `title: string`, `linkTo?: string`, `linkLabel?: string`

```
СКИДКИ    [ Смотреть все > ]
```

### 5.4 HeroBanner

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
4. **Super category sections** — rendered from `useGetCategoriesTreeQuery()`:
   - One `<section>` per super category in `sort_order` order
   - `<SectionHeader title={superCat.name} linkTo={"/catalog?super=" + superCat.id} linkLabel="Смотреть все" />`
   - Horizontal scrollable grid of `<SubCategoryCard />` for each child in `superCat.children`
   - Only rendered if `superCat.children.length > 0`
5. `<SectionHeader title="ХИТ ПРОДАЖ" linkTo="/catalog" />` + product grid
   → `useGetProductsQuery({ page_size: 8 })`

### 7.2 CatalogPage (`/catalog`)

**New file:** `frontend/src/pages/CatalogPage.tsx`

URL params: `?category=`, `?super=`, `?q=`, `?has_discount=`, `?sort=`, `?page=`

- `?super=<id>` maps to `super_category_id` in the API call — loads all products under that super category
- `?category=<id>` maps to `category_id` — loads products in a specific sub-category

Filter bar (bottom sheet on mobile):

- **Category tree** (data from `useGetCategoriesTreeQuery()`):
  - Super category name → bold non-clickable group label + "Все" shortcut (`?super=<id>`)
  - Child categories → checkboxes indented beneath their parent
  - Standalone categories (no parent, not super) → after all grouped sections, ungrouped
- Sort pill: По популярности / Цена ↑ / Цена ↓
- Discount toggle, in-stock toggle

Product grid:

- 2-col responsive grid via `useGetProductsQuery(params)`
- Load More button (appends next page) — not paginator
- Breadcrumb: Главная / Каталог / {superCatName or subCatName if filtered}
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

1. `backend/app/models.py` — add 5 columns + relationships to `Category`; run Alembic migration
2. `backend/app/config.py` — add `category_images_dir`
3. `backend/app/schemas.py` — add `CategoryChild`, `CategoryTree`, update `CategoryRead/Create/Update`
4. `backend/app/services/category_service.py` — add `get_category_tree()`, extend `get_categories()`
5. `backend/app/services/product_service.py` — add `super_category_id` filter
6. `backend/app/routers/storefront.py` — add `/store/categories/tree` endpoint + `super_category_id` param to products
7. `backend/app/routers/admin/categories.py` — add `POST/DELETE /admin/categories/{id}/image`
8. Register storefront router in `backend/main.py`
9. Admin frontend — extend category modal with parent dropdown, is_super toggle, color picker, image upload
10. `tailwind.config.ts` brand colors + font imports in `index.css`
11. `frontend/src/features/storefront/types.ts` — add `CategoryChild`, `CategoryTree`
12. `frontend/src/features/storefront/api.ts` — add `getCategoriesTree` query
13. `frontend/src/features/cart/slice.ts` + redux-persist setup
14. `frontend/src/components/layout/` — Header, CategoryPills (super cats), BottomNav, PageWrapper
15. `frontend/src/components/ui/` — ProductCard, SubCategoryCard, SectionHeader, HeroBanner
16. `frontend/src/pages/HomePage.tsx` — with super category sections
17. `frontend/src/pages/CatalogPage.tsx` — with two-level sidebar + `?super=` support
18. `frontend/src/pages/ProductDetailPage.tsx`
19. `frontend/src/app/router.tsx` — update routes

---

## Critical Files

| What changes                              | File                                               |
| ----------------------------------------- | -------------------------------------------------- |
| Category hierarchy (model)                | `backend/app/models.py`                            |
| Category images dir config                | `backend/app/config.py`                            |
| New schemas (CategoryChild, CategoryTree) | `backend/app/schemas.py`                           |
| Category tree query + super filter        | `backend/app/services/category_service.py`         |
| super_category_id filter                  | `backend/app/services/product_service.py`          |
| New public API + tree endpoint            | `backend/app/routers/storefront.py`                |
| Category image upload (admin)             | `backend/app/routers/admin/categories.py`          |
| Register router                           | `backend/main.py`                                  |
| Brand colors                              | `frontend/tailwind.config.ts`                      |
| Global fonts                              | `frontend/src/index.css`                           |
| Storefront types                          | `frontend/src/features/storefront/types.ts`        |
| RTK Query API (incl. getCategoriesTree)   | `frontend/src/features/storefront/api.ts`          |
| Cart state                                | `frontend/src/features/cart/slice.ts`              |
| Redux store                               | `frontend/src/store/index.ts`                      |
| Header                                    | `frontend/src/components/layout/Header.tsx`        |
| CategoryPills (super cats)                | `frontend/src/components/layout/CategoryPills.tsx` |
| BottomNav                                 | `frontend/src/components/layout/BottomNav.tsx`     |
| PageWrapper                               | `frontend/src/components/layout/PageWrapper.tsx`   |
| ProductCard                               | `frontend/src/components/ui/ProductCard.tsx`       |
| SubCategoryCard                           | `frontend/src/components/ui/SubCategoryCard.tsx`   |
| HeroBanner                                | `frontend/src/components/ui/HeroBanner.tsx`        |
| SectionHeader                             | `frontend/src/components/ui/SectionHeader.tsx`     |
| Homepage (super category sections)        | `frontend/src/pages/HomePage.tsx`                  |
| Catalog (two-level sidebar, ?super=)      | `frontend/src/pages/CatalogPage.tsx`               |
| Product detail                            | `frontend/src/pages/ProductDetailPage.tsx`         |
| Router                                    | `frontend/src/app/router.tsx`                      |

---

## Verification

1. **Migration:** `alembic upgrade head` runs cleanly; existing categories gain null values for new columns without breaking admin CRUD
2. **Admin category form:** Create a super category (toggle on) → appears in parent dropdown. Create a sub-category with parent → color picker and image upload appear. Upload an image → saved to `static/categories/`, URL stored in DB.
3. **Backend tree:** `GET /store/categories/tree` returns super categories with their children; standalone categories do not appear in tree
4. **Backend super filter:** `GET /store/products?super_category_id=1` returns products from all child categories of super cat 1
5. **Homepage:** Visit `/` — hero banner, promo row, discount section, then one section per super category showing sub-category cards with correct background colors and images; "Смотреть все" links work
6. **Category pills:** Show super categories only; clicking one goes to `/catalog?super=X`
7. **Catalog sidebar:** Super category group labels visible; sub-categories as indented checkboxes; standalone categories ungrouped at bottom; `?super=X` pre-highlights all children
8. **Product detail:** Click a product card → navigate to `/product/:id` → see image, price, "В корзину" button
9. **Add to cart:** Click "В корзину" → BottomNav cart button shows count badge
10. **Cart persists:** Reload page → cart items still in BottomNav count (redux-persist)
11. **Mobile:** Test at 375px width — all layouts correct, bottom nav fixed, sub-category cards scroll horizontally
12. **Admin unchanged:** `/admin` still requires login, existing product/category CRUD still works
