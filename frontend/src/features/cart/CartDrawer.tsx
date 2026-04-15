// ── Cart Drawer ────────────────────────────────────────────────────────────────
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { closeCart, removeItem, updateQuantity, clearCart, selectCartTotal, type CartItem } from "./slice";
// ── Price Formatter ────────────────────────────────────────────────────────────
const formatPrice = (value: number): string =>
   value.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
   });
// ── Cart Item Row ─────────────────────────────────────────────────────────────
function CartItemRow({ item }: { item: CartItem }) {
   const dispatch = useAppDispatch();

   // ── Handlers ────────────────────────────────────────────────────────────────
   const decrement = () => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }));

   const increment = () => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }));

   const remove = () => dispatch(removeItem(item.productId));

   return (
      <div className="flex items-start gap-3 py-4 border-b border-gray-100 last:border-0">
         {/* ── Product Image ──────────────────────────────────────────────────── */}
         <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            {item.imageUrl ? (
               <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-300 text-[10px]">Нет фото</span>
               </div>
            )}
         </div>

         {/* ── Info + Controls ────────────────────────────────────────────────── */}
         <div className="flex-1 min-w-0">
            {/* ── Name ──────────────────────────────────────────────────────────── */}
            <p className="text-sm text-gray-800 leading-snug line-clamp-2 mb-1">{item.name}</p>

            {/* ── Unit Price ────────────────────────────────────────────────────── */}
            <p className="text-xs text-gray-400 mb-2">{formatPrice(item.price)} € / шт</p>

            {/* ── Quantity Stepper + Subtotal Row ───────────────────────────────── */}
            <div className="flex items-center justify-between">
               {/* ── Stepper ─────────────────────────────────────────────────────── */}
               <div className="flex items-center gap-1">
                  <button
                     onClick={decrement}
                     className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 flex
  items-center justify-center text-base leading-none"
                     aria-label="Уменьшить"
                  >
                     −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                  <button
                     onClick={increment}
                     disabled={item.quantity >= item.maxStock}
                     className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 flex
  items-center justify-center text-base leading-none disabled:opacity-40"
                     aria-label="Увеличить"
                  >
                     +
                  </button>
               </div>

               {/* ── Subtotal + Remove ─────────────────────────────────────────────── */}
               <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-trust-green">
                     {formatPrice(item.price * item.quantity)} €
                  </span>
                  <button
                     onClick={remove}
                     className="text-gray-300 hover:text-amber transition-colors"
                     aria-label="Удалить"
                  >
                     {/* Trash icon */}
                     <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                     >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                     </svg>
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

// ── CartDrawer ─────────────────────────────────────────────────────────────────
export function CartDrawer() {
   const dispatch = useAppDispatch();
   const isOpen = useAppSelector((s) => s.cart.isOpen);
   const items = useAppSelector((s) => s.cart.items);
   const total = useAppSelector(selectCartTotal);

   return (
      <>
         {/* ── Backdrop ──────────────────────────────────────────────────────────── */}
         <div
            onClick={() => dispatch(closeCart())}
            className={[
               "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
               isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
            aria-hidden="true"
         />

         {/* ── Panel ─────────────────────────────────────────────────────────────── */}
         <div
            role="dialog"
            aria-modal="true"
            aria-label="Корзина"
            className={[
               "fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white shadow-2xl flex flex-col",
               "transition-transform duration-300",
               isOpen ? "translate-x-0" : "translate-x-full",
            ].join(" ")}
         >
            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <div
               className="flex items-center justify-between px-5 py-4 border-b border-gray-100      
  shrink-0"
            >
               <h2 className="font-heading text-lg font-bold text-baltic-navy">Корзина</h2>
               <button
                  onClick={() => dispatch(closeCart())}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400        
  hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Закрыть"
               >
                  <svg
                     width="18"
                     height="18"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2.5"
                     strokeLinecap="round"
                  >
                     <line x1="18" y1="6" x2="6" y2="18" />
                     <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
               </button>
            </div>

            {/* ── Items List ──────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5">
               {items.length === 0 ? (
                  // ── Empty State ───────────────────────────────────────────────────
                  <div
                     className="flex flex-col items-center justify-center h-full gap-3 text-center    
  pb-10"
                  >
                     <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-200"
                     >
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                     </svg>
                     <p className="text-gray-400 text-sm">Корзина пуста</p>
                     <button
                        onClick={() => dispatch(closeCart())}
                        className="text-trust-green text-sm font-semibold underline underline-offset-2"
                     >
                        Перейти в каталог
                     </button>
                  </div>
               ) : (
                  // ── Item Rows ─────────────────────────────────────────────────────
                  items.map((item) => <CartItemRow key={item.productId} item={item} />)
               )}
            </div>

            {/* ── Footer (only when items exist) ──────────────────────────────────── */}
            {items.length > 0 && (
               <div className="px-5 py-4 border-t border-gray-100 shrink-0 flex flex-col gap-3">
                  {/* ── Total Row ─────────────────────────────────────────────────── */}
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-500">Итого</span>
                     <span className="text-lg font-bold text-baltic-navy">{formatPrice(total)} €</span>
                  </div>

                  {/* ── Checkout CTA ──────────────────────────────────────────────── */}
                  <button
                     className="w-full py-3 bg-trust-green text-white rounded-xl font-semibold text-sm   
  shadow-sm"
                  >
                     Оформить заказ
                  </button>

                  {/* ── Clear Cart ────────────────────────────────────────────────── */}
                  <button
                     onClick={() => dispatch(clearCart())}
                     className="w-full text-center text-xs text-gray-400 hover:text-amber
  transition-colors"
                  >
                     Очистить корзину
                  </button>
               </div>
            )}
         </div>
      </>
   );
}
