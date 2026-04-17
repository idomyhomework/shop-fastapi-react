# Phase 3 — Shopping Cart (Completion)

## Context

Phase 2 is complete: the full storefront (Homepage, Catalog, Product Detail) is live with public APIs,
RTK Query, brand colors, and all layout components. As part of Phase 2, the cart foundation was already
built — the Redux slice, CartDrawer UI, redux-persist, and BottomNav badge are all in place and verified.

Phase 3 closes the remaining UX gaps in the cart before handing off to Phase 4 (Checkout & Orders):
- the drawer does not open automatically when a product is added
- no free shipping threshold progress in the drawer footer
- the checkout CTA button in the drawer does nothing
- the empty-state "go to catalog" link only closes the drawer, does not navigate

---

## What's Already Done

| Feature | File |
|---|---|
| Cart slice — addItem, removeItem, updateQuantity, clearCart, openCart, closeCart, selectors | `frontend/src/features/cart/slice.ts` |
| CartDrawer — slide-in panel, item rows, qty controls, subtotal, clear cart | `frontend/src/features/cart/CartDrawer.tsx` |
| CartDrawer mounted globally outside the router | `frontend/src/App.tsx` |
| redux-persist + PersistGate (cart items survive reload) | `frontend/src/store/index.ts`, `frontend/src/app/providers.tsx` |
| BottomNav — opens drawer on tap, shows live item count badge | `frontend/src/components/layout/BottomNav.tsx` |
| ProductCard — dispatches addItem | `frontend/src/components/ui/ProductCard.tsx` |
| ProductDetailPage — dispatches addItem + quantity | `frontend/src/pages/ProductDetailPage.tsx` |

---

## What's Missing Right Now

1. **Drawer does not open on add** — "В корзину" on cards and the product detail page add items silently; the user must notice the BottomNav badge change and tap manually
2. **No free shipping message** — CartDrawer footer shows the total but no "X € más para envío gratis" progress bar
3. **Checkout button is dead** — "Оформить заказ" in CartDrawer has no onClick; tapping it does nothing
4. **Empty cart link does not navigate** — "Перейти в каталог" dispatches closeCart but the user stays on the same page

---

## 1. Open Cart Drawer Automatically After "В корзину"

### 1.1 ProductCard

**File:** `frontend/src/components/ui/ProductCard.tsx`

Import `openCart` alongside `addItem` and dispatch it immediately after:

```ts
// ── Handle Add to Cart ─────────────────────────────────────────────────────
import { addItem, openCart } from "../../features/cart/slice";

const handleAddToCart = () => {
   if (outOfStock) return;
   dispatch(
      addItem({
         productId: product.id,
         name: product.name,
         price: parseFloat(product.current_price),
         imageUrl: rawImageUrl ? `${BASE_URL}${rawImageUrl}` : null,
         maxStock: product.stock_quantity,
      })
   );
   dispatch(openCart());   // ← open the drawer so the user sees the item was added
   onAddToCart?.(product);
};
```

### 1.2 ProductDetailPage

**File:** `frontend/src/pages/ProductDetailPage.tsx`

Import `openCart` and dispatch it at the end of `handleAddToCart`:

```ts
// ── Add to Cart ────────────────────────────────────────────────────────────
import { addItem, updateQuantity, openCart } from "../features/cart/slice";

const handleAddToCart = () => {
   if (!product || outOfStock) return;
   const imageUrl = images[0] ? `${BASE_URL}${images[0].image_url}` : null;
   dispatch(
      addItem({
         productId: product.id,
         name: product.name,
         price: parseFloat(product.current_price),
         imageUrl,
         maxStock: product.stock_quantity,
      })
   );
   if (quantity > 1) {
      dispatch(updateQuantity({ productId: product.id, quantity }));
   }
   dispatch(openCart());   // ← open drawer
   setQuantity(1);
};
```

---

## 2. Free Shipping Threshold in CartDrawer

**File:** `frontend/src/features/cart/CartDrawer.tsx`

Add a threshold constant at the top of the file and insert a progress bar in the footer between
the total row and the checkout button. The bar fills as the cart total grows; message swaps to
"Бесплатная доставка!" once the threshold is reached.

```tsx
// ── Free Shipping Threshold ───────────────────────────────────────────────────
const FREE_SHIPPING_THRESHOLD = 50; // €
```

Inside the footer block (where `items.length > 0`), after the total row:

```tsx
{/* ── Free Shipping Bar ─────────────────────────────────────────────── */}
{total < FREE_SHIPPING_THRESHOLD ? (
   <div>
      <p className="text-xs text-gray-400 mb-1.5">
         Тебе не хватает{" "}
         <span className="font-semibold text-amber">
            {formatPrice(FREE_SHIPPING_THRESHOLD - total)} €
         </span>{" "}
         до бесплатной доставки
      </p>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
         <div
            className="h-full bg-trust-green rounded-full transition-all duration-300"
            style={{ width: `${Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
         />
      </div>
   </div>
) : (
   <p className="text-xs text-trust-green font-semibold text-center">
      Бесплатная доставка!
   </p>
)}
```

---

## 3. Wire the Checkout CTA Button

**File:** `frontend/src/features/cart/CartDrawer.tsx`

Import `useNavigate` from react-router-dom and add an `onClick` to the checkout button.
Closing the drawer before navigating prevents the backdrop from remaining visible.

```tsx
import { useNavigate } from "react-router-dom";

// Inside CartDrawer():
// ── Navigation ────────────────────────────────────────────────────────────────
const navigate = useNavigate();

// Checkout button — replace the existing <button> with:
{/* ── Checkout CTA ──────────────────────────────────────────────── */}
<button
   onClick={() => { dispatch(closeCart()); navigate("/checkout"); }}
   className="w-full py-3 bg-trust-green text-white rounded-xl font-semibold text-sm shadow-sm"
>
   Оформить заказ
</button>
```

---

## 4. Fix Empty Cart "Go to Catalog" Link

**File:** `frontend/src/features/cart/CartDrawer.tsx`

`useNavigate` is already imported in Step 3. Update the empty-state button:

```tsx
{/* ── Empty State — go to catalog ───────────────────────────────────── */}
<button
   onClick={() => { dispatch(closeCart()); navigate("/catalog"); }}
   className="text-trust-green text-sm font-semibold underline underline-offset-2"
>
   Перейти в каталог
</button>
```

---

## 5. Checkout Stub Page + Route

Phase 4 builds the full checkout form. For now, add a stub so the `/checkout` route resolves
and the navigation from Step 3 does not land on a 404.

**New file:** `frontend/src/pages/CheckoutPage.tsx`

```tsx
// ── Checkout Page ─────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { PageWrapper } from "../components/layout/PageWrapper";

// ── Component ──────────────────────────────────────────────────────────────────
export function CheckoutPage() {
   return (
      <PageWrapper showCategoryPills={false}>
         <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-lg font-semibold text-baltic-navy mb-2">Оформление заказа</p>
            <p className="text-sm text-gray-400 mb-6">
               Здесь скоро будет форма оформления заказа
            </p>
            <Link
               to="/catalog"
               className="px-6 py-2.5 rounded-full bg-amber text-white font-semibold text-sm"
            >
               Вернуться в каталог
            </Link>
         </div>
      </PageWrapper>
   );
}
```

**Modify:** `frontend/src/app/router.tsx` — add the checkout route:

```tsx
import { CheckoutPage } from "../pages/CheckoutPage";

// Inside <Routes>:
<Route path="/checkout" element={<CheckoutPage />} />
```

---

## Implementation Order

1. `ProductCard.tsx` — import and dispatch `openCart()` after `addItem`
2. `ProductDetailPage.tsx` — import and dispatch `openCart()` after `addItem`
3. `CartDrawer.tsx` — add `FREE_SHIPPING_THRESHOLD` constant + progress bar in footer
4. `CartDrawer.tsx` — import `useNavigate`, wire checkout button onClick, fix empty-state link
5. `CheckoutPage.tsx` — create stub page
6. `router.tsx` — add `/checkout` route

---

## Critical Files

| What changes | File |
|---|---|
| Open drawer on add | `frontend/src/components/ui/ProductCard.tsx` |
| Open drawer on add | `frontend/src/pages/ProductDetailPage.tsx` |
| Free shipping bar + checkout CTA + empty state nav | `frontend/src/features/cart/CartDrawer.tsx` |
| Checkout stub | `frontend/src/pages/CheckoutPage.tsx` |
| New /checkout route | `frontend/src/app/router.tsx` |

---

## Verification

1. **Drawer opens on card add** — Click "В корзину" on any ProductCard (homepage or catalog) → CartDrawer slides in from the right, item visible in the list
2. **Drawer opens on detail add** — On product detail page set quantity to 2, click "В корзину" → drawer opens, item shows qty 2
3. **Free shipping — progress state** — Add items totalling less than 50 € → footer shows progress bar with correct remaining amount and animated fill
4. **Free shipping — reached state** — Bring total to ≥ 50 € → bar fills fully and text switches to "Бесплатная доставка!"
5. **Checkout navigation** — Open cart with items → click "Оформить заказ" → drawer closes, page navigates to `/checkout` stub
6. **Empty state navigation** — Clear cart (or open with no items) → click "Перейти в каталог" → drawer closes and page navigates to `/catalog`
7. **Cart persists across reload** — Add items, hard-reload the page → items still present, BottomNav badge still shows correct count (redux-persist)
8. **Stock cap in drawer** — In CartDrawer, increment a item's quantity up to its maxStock value → `+` button becomes disabled at the limit
