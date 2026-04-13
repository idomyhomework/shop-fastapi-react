// ── Product Card ───────────────────────────────────────────────────────────────
import { Heart } from "lucide-react";
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
      <div className="bg-card-bg border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
         {/* ── Image Area ────────────────────────────────────────────────────── */}
         <div className="relative aspect-[3/4] bg-gray-50">
            {/* ── Product Image ──────────────────────────────────────────────── */}
            {mainImageUrl ? (
               <img src={mainImageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-300 text-xs">Нет фото</span>
               </div>
            )}

            {/* ── Discount Badge ─────────────────────────────────────────────── */}
            {product.has_discount && product.discount_percentage && (
               <span className="absolute top-2 left-2 bg-amber text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">
                  %
               </span>
            )}

            {/* ── Wishlist Icon ──────────────────────────────────────────────── */}
            <button
               className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-300 hover:text-amber transition-colors shadow-sm"
               aria-label="В избранное"
               tabIndex={-1}
            >
               <Heart size={15} />
            </button>
         </div>

         {/* ── Info Area ─────────────────────────────────────────────────────── */}
         <div className="p-3 flex flex-col gap-1.5 flex-1">
            {/* ── Stock + Original Price Row ─────────────────────────────────── */}
            <div className="flex items-center justify-between gap-1">
               <span className="text-xs text-gray-400">
                  {outOfStock ? "Нет в наличии" : `В наличии ${product.stock_quantity} шт`}
               </span>
               {product.has_discount && (
                  <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)} €</span>
               )}
            </div>

            {/* ── Product Name ───────────────────────────────────────────────── */}
            <p className="text-sm text-gray-800 line-clamp-2 flex-1 leading-snug mb-0">{product.name}</p>

            {/* ── Current Price ──────────────────────────────────────────────── */}
            <p className="text-base font-bold text-trust-green leading-none">{formatPrice(product.current_price)} €</p>

            {/* ── Add to Cart Button ─────────────────────────────────────────── */}
            <button
               onClick={handleAddToCart}
               disabled={outOfStock}
               className={`mt-1 w-full py-1.5 rounded-full text-sm font-semibold border transition-colors shadow-none ${
                  outOfStock
                     ? "bg-trust-green border-gray-200 text-green-trust cursor-not-allowed"
                     : "bg-trust-green border-gray-300 text-green-trust hover:bg-amber hover:text-white active:scale-95"
               }`}
            >
               В корзину
            </button>
         </div>
      </div>
   );
}
