// ── Product Card ───────────────────────────────────────────────────────────────
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { addItem } from "../../features/cart/slice";
import type { Product } from "../../features/storefront/types";
import { BASE_URL } from "../../config";

// ── Props ──────────────────────────────────────────────────────────────────────
interface ProductCardProps {
   product: Product;
   onAddToCart?: (product: Product) => void;
}

// ── Price Formatter ────────────────────────────────────────────────────────────
const formatPrice = (value: string | number): string =>
   parseFloat(String(value)).toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
   });

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
   const dispatch = useAppDispatch();

   // ── Resolve Main Image ─────────────────────────────────────────────────────
   const rawImageUrl = product.images.find((img) => img.is_main)?.image_url ?? product.images[0]?.image_url ?? null;
   const mainImageUrl = rawImageUrl ? `${BASE_URL}${rawImageUrl}` : null;

   // ── Out of Stock ───────────────────────────────────────────────────────────
   const outOfStock = product.stock_quantity === 0;

   // ── Handle Add to Cart ─────────────────────────────────────────────────────
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
      onAddToCart?.(product);
   };

   // ── Render ─────────────────────────────────────────────────────────────────
   return (
      <div className={`bg-card-bg border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm transition-opacity ${outOfStock ? "opacity-60" : ""}`}>
         {/* ── Clickable area — navigates to product page ─────────────────────── */}
         <Link to={`/product/${product.id}`} className="flex flex-col flex-1 min-w-0">
            {/* ── Image Area ─────────────────────────────────────────────────── */}
            <div className="relative aspect-[3/4] bg-gray-50">
               {/* ── Product Image ────────────────────────────────────────────── */}
               {mainImageUrl ? (
                  <img src={mainImageUrl} alt={product.name} className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                     <span className="text-gray-300 text-xs">Нет фото</span>
                  </div>
               )}

               {/* ── Out of Stock Overlay ───────────────────────────────────── */}
               {outOfStock && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5">
                     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                     </svg>
                     <span className="text-white text-xs font-semibold tracking-wide">Нет в наличии</span>
                  </div>
               )}

               {/* ── Discount Badge ────────────────────────────────────────────── */}
               {product.has_discount && product.discount_percentage && (
                  <span className="absolute top-2 left-2 bg-amber text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
                     %
                  </span>
               )}

               {/* ── Wishlist Icon — stopPropagation so it doesn't follow Link ── */}
               <button
                  onClick={(e) => e.preventDefault()}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-300 hover:text-amber transition-colors shadow-sm"
                  aria-label="В избранное"
               >
                  <Heart size={15} />
               </button>
            </div>

            {/* ── Info Area ──────────────────────────────────────────────────── */}
            <div className="p-3 flex flex-col gap-1.5 flex-1">
               {/* ── Stock + Original Price Row ─────────────────────────────── */}
               <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-gray-400">
                     {outOfStock ? "Нет в наличии" : `В наличии ${product.stock_quantity} шт`}
                  </span>
                  {product.has_discount && (
                     <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)} €</span>
                  )}
               </div>

               {/* ── Product Name ──────────────────────────────────────────── */}
               <p className="text-sm text-gray-800 line-clamp-2 flex-1 leading-snug mb-0">{product.name}</p>

               {/* ── Current Price ─────────────────────────────────────────── */}
               <p className="text-base font-bold text-trust-green leading-none">{formatPrice(product.current_price)} €</p>
            </div>
         </Link>

         {/* ── Add to Cart Button — outside Link so it doesn't navigate ──────── */}
         <div className="px-3 pb-3">
            <button
               onClick={handleAddToCart}
               disabled={outOfStock}
               className={`w-full py-1.5 rounded-full text-sm font-semibold border transition-colors shadow-none ${
                  outOfStock
                     ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                     : "bg-trust-green border-gray-300 text-white hover:bg-amber active:scale-95"
               }`}
            >
               {outOfStock ? "Нет в наличии" : "В корзину"}
            </button>
         </div>
      </div>
   );
}
