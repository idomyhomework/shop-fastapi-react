// ── Product Detail Page ─────────────────────────────────────────────────────────
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Heart, Minus, Plus } from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import ProductCard from "../components/ui/ProductCard";
import { useGetProductQuery, useGetProductsQuery } from "../features/storefront/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addItem, openCart, updateQuantity, selectCartItems } from "../features/cart/slice";
import { BASE_URL } from "../config";

// ── Price Formatter ────────────────────────────────────────────────────────────
const formatPrice = (value: string | number): string =>
   parseFloat(String(value)).toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
   });

// ── Skeleton Loader ────────────────────────────────────────────────────────────
function ProductDetailSkeleton() {
   return (
      <div className="px-4 pt-4 pb-6 animate-pulse">
         <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
         <div className="aspect-square bg-gray-200 rounded-2xl mb-4" />
         <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
         <div className="h-6 bg-gray-200 rounded w-3/4 mb-1" />
         <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
         <div className="h-9 bg-gray-200 rounded w-1/3 mb-5" />
         <div className="h-12 bg-gray-200 rounded-full mb-4" />
         <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
         </div>
      </div>
   );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function ProductDetailPage() {
   const { id } = useParams<{ id: string }>();
   const productId = id ? parseInt(id, 10) : 0;
   const dispatch = useAppDispatch();

   // ── Local State ───────────────────────────────────────────────────────────
   const [quantity, setQuantity] = useState(1);
   const [activeImageIndex, setActiveImageIndex] = useState(0);
   const [showMaxWarning, setShowMaxWarning] = useState(false);

   // ── Cart State ────────────────────────────────────────────────────────────
   const cartItems = useAppSelector(selectCartItems);

   // ── API Queries ───────────────────────────────────────────────────────────
   const {
      data: product,
      isLoading,
      isError,
   } = useGetProductQuery(productId, {
      skip: !productId,
   });

   const firstCategoryId = product?.categories[0]?.id;
   const { data: relatedData } = useGetProductsQuery(
      { category_id: firstCategoryId, page_size: 8 },
      { skip: !firstCategoryId }
   );

   // ── Derived Values ─────────────────────────────────────────────────────────
   const images = product?.images ?? [];
   const activeImage = images[activeImageIndex] ?? images.find((img) => img.is_main) ?? images[0];
   const mainImageUrl = activeImage ? `${BASE_URL}${activeImage.image_url}` : null;
   const outOfStock = (product?.stock_quantity ?? 0) === 0;
   const hasDiscount = product?.has_discount && product.discount_percentage;
   const relatedProducts = relatedData?.items.filter((p) => p.id !== productId).slice(0, 6) ?? [];

   // ── Quantity Handlers ──────────────────────────────────────────────────────
   const increment = () => {
      if (product && quantity < product.stock_quantity) setQuantity((q) => q + 1);
   };
   const decrement = () => {
      if (quantity > 1) setQuantity((q) => q - 1);
   };

   // ── Add to Cart ────────────────────────────────────────────────────────────
   // addItem always starts at qty 1; dispatch updateQuantity after to apply the selector value
   const handleAddToCart = () => {
      if (!product || outOfStock) return;

      const cartItem = cartItems.find((i) => i.productId === product.id);
      if (cartItem && cartItem.quantity >= product.stock_quantity) {
         setShowMaxWarning(true);
         setTimeout(() => setShowMaxWarning(false), 3000);
         return;
      }

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
      dispatch(openCart());
      if (quantity > 1) {
         dispatch(updateQuantity({ productId: product.id, quantity }));
      }
      setQuantity(1);
   };

   // ── Loading State ──────────────────────────────────────────────────────────
   if (isLoading) {
      return (
         <PageWrapper showCategoryPills={false}>
            <ProductDetailSkeleton />
         </PageWrapper>
      );
   }

   // ── Error / Not Found State ────────────────────────────────────────────────
   if (isError || !product) {
      return (
         <PageWrapper showCategoryPills={false}>
            <div
               className="flex flex-col items-center justify-center py-24  
 text-center px-4"
            >
               <div className="text-5xl mb-4">😕</div>
               <p className="text-gray-600 font-medium">Товар не найден</p>
               <p className="text-gray-400 text-sm mt-1">Возможно, он был удалён или недоступен</p>
               <Link
                  to="/catalog"
                  className="mt-5 px-6 py-2.5 rounded-full bg-amber
 text-white font-semibold text-sm"
               >
                  Вернуться в каталог
               </Link>
            </div>
         </PageWrapper>
      );
   }

   // ── Render ─────────────────────────────────────────────────────────────────
   return (
      <PageWrapper showCategoryPills={false}>
         <div className="pb-6">
            {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
            <nav className="flex items-center gap-1 text-xs text-gray-400 px-4 pt-4 mb-4 flex-wrap">
               <Link to="/" className="hover:text-amber transition-colors">
                  Главная
               </Link>
               <ChevronRight size={12} />
               <Link to="/catalog" className="hover:text-amber transition-colors">
                  Каталог
               </Link>
               {product.categories[0] && (
                  <>
                     <ChevronRight size={12} />
                     <Link
                        to={`/catalog?category=${product.categories[0].id}`}
                        className="hover:text-amber transition-colors"
                     >
                        {product.categories[0].name}
                     </Link>
                  </>
               )}
               <ChevronRight size={12} />
               <span className="text-gray-600 truncate max-w-[140px]">{product.name}</span>
            </nav>

            {/* ── Two-Column Layout (stacked mobile, side-by-side md+) ──────────── */}
            <div className="md:grid md:grid-cols-2 md:gap-10 md:px-8 md:items-start">
               {/* ── Left: Image + Thumbnails ─────────────────────────────────── */}
               <div>
                  {/* ── Main Image ──────────────────────────────────────────────── */}
                  <div className="relative bg-gray-50 mx-4 md:mx-0 sm:max-w-96 sm:mx-auto lg:min-w-full rounded-2xl overflow-hidden aspect-square mb-3">
                     {mainImageUrl ? (
                        <img src={mainImageUrl} alt={product.name} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <span className="text-gray-300 text-sm">Нет фото</span>
                        </div>
                     )}

                     {/* ── Discount Badge ──────────────────────────────────────── */}
                     {hasDiscount && (
                        <span className="absolute top-3 left-3 bg-amber text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                           -{product.discount_percentage}%
                        </span>
                     )}
                  </div>

                  {/* ── Thumbnails ──────────────────────────────────────────────── */}
                  {images.length > 1 && (
                     <div className="flex gap-2 px-4 md:px-0 mb-4 overflow-x-auto no-scrollbar">
                        {images.map((img, i) => (
                           <button
                              key={img.id}
                              onClick={() => setActiveImageIndex(i)}
                              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                                 i === activeImageIndex ? "border-amber" : "border-gray-100"
                              }`}
                           >
                              <img src={`${BASE_URL}${img.image_url}`} alt="" className="w-full h-full object-cover" />
                           </button>
                        ))}
                     </div>
                  )}
               </div>

               {/* ── Right: Product Info ──────────────────────────────────────── */}
               <div className="px-4 md:px-0 md:pt-1">
                  {/* ── Category Label ──────────────────────────────────────────── */}
                  {product.categories[0] && (
                     <Link
                        to={`/catalog?category=${product.categories[0].id}`}
                        className="text-sm text-gray-400 hover:text-amber transition-colors mb-2 block"
                     >
                        {product.categories[0].name}
                     </Link>
                  )}

                  {/* ── Product Name ─────────────────────────────────────────────── */}
                  <h1 className="text-2xl font-bold text-baltic-navy font-heading leading-snug mb-3">{product.name}</h1>

                  {/* ── Stock Info ───────────────────────────────────────────────── */}
                  <p className={`text-sm mb-5 ${outOfStock ? "text-red-500" : "text-gray-500"}`}>
                     {outOfStock ? "Нет в наличии" : `В наличии ${product.stock_quantity} шт`}
                  </p>

                  {/* ── Price + Add to Cart + Wishlist ───────────────────────────── */}
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                     {/* ── Price ─────────────────────────────────────────────────── */}
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-baltic-navy">
                           {formatPrice(product.current_price)} €/шт
                        </span>
                        {hasDiscount && (
                           <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)} €</span>
                        )}
                     </div>

                     {/* ── Quantity Selector ─────────────────────────────────────── */}
                     <div className="flex items-center gap-1.5 border border-gray-200 rounded-full px-2 py-1">
                        <button
                           onClick={decrement}
                           disabled={quantity <= 1}
                           className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-amber disabled:text-gray-200 transition-colors"
                        >
                           <Minus size={15} />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-gray-800">{quantity}</span>
                        <button
                           onClick={increment}
                           disabled={outOfStock || quantity >= product.stock_quantity}
                           className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-amber disabled:text-gray-200 transition-colors"
                        >
                           <Plus size={15} />
                        </button>
                     </div>

                     {/* ── Add to Cart Button ────────────────────────────────────── */}
                     <button
                        onClick={handleAddToCart}
                        disabled={outOfStock}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
                           outOfStock
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-baltic-navy text-white hover:bg-amber active:scale-95"
                        }`}
                     >
                        {outOfStock ? "Нет в наличии" : "В корзину"}
                     </button>

                     {/* ── Wishlist Button ───────────────────────────────────────── */}
                     <button
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 hover:text-amber hover:border-amber transition-colors"
                        aria-label="В избранное"
                     >
                        <Heart size={18} />
                     </button>
                  </div>

                  {/* ── Max Stock Warning ─────────────────────────────────────────── */}
                  {showMaxWarning && (
                     <p className="text-sm text-amber font-medium bg-amber/10 rounded-lg px-3 py-2 -mt-2 mb-2">
                        В корзине уже весь доступный товар
                     </p>
                  )}

                  {/* ── Description ─────────────────────────────────────────────── */}
                  {product.description && (
                     <p className="text-sm text-gray-600 leading-relaxed mb-5">{product.description}</p>
                  )}

                  {/* ── Bar Code ────────────────────────────────────────────────── */}
                  {product.bar_code && (
                     <p className="text-xs text-gray-400">
                        Штрих-код: <span className="font-mono">{product.bar_code}</span>
                     </p>
                  )}
               </div>
            </div>

            {/* ── Related Products ─────────────────────────────────────────────── */}
            {relatedProducts.length > 0 && (
               <div className="mt-8">
                  {/* ── Section Header ────────────────────────────────────────────── */}
                  <div className="flex items-center justify-between px-4 md:px-8 mb-3">
                     <h2 className="text-base font-bold text-baltic-navy">Похожие товары</h2>
                     {product.categories[0] && (
                        <Link
                           to={`/catalog?category=${product.categories[0].id}`}
                           className="text-xs text-amber font-medium flex items-center gap-0.5"
                        >
                           Смотреть все <ChevronRight size={13} />
                        </Link>
                     )}
                  </div>

                  {/* ── Horizontal Scroll ─────────────────────────────────────────── */}
                  <div className="flex gap-3 px-4 md:px-8 overflow-x-auto no-scrollbar pb-2">
                     {relatedProducts.map((p) => (
                        <div key={p.id} className="flex-shrink-0 w-[160px]">
                           <ProductCard product={p} />
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </PageWrapper>
   );
}
