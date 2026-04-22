// ── Catalog Page ───────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, ChevronRight, X } from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import ProductCard from "../components/ui/ProductCard";
import { useGetProductsQuery, useGetCategoriesQuery, useGetCategoriesTreeQuery } from "../features/storefront/api";
import type { Product, ProductsQueryParams } from "../features/storefront/types";

// ── Sort Options ───────────────────────────────────────────────────────────────
const SORT_OPTIONS: { label: string; value: ProductsQueryParams["sort"] }[] = [
   { label: "По популярности", value: "popular" },
   { label: "Цена ↑", value: "price_asc" },
   { label: "Цена ↓", value: "price_desc" },
];

// ── Skeleton Grid ──────────────────────────────────────────────────────────────
function SkeletonGrid() {
   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
         {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card-bg rounded-2xl h-64 animate-pulse border border-gray-100" />
         ))}
      </div>
   );
}

// ── Category Sheet ─────────────────────────────────────────────────────────────
interface CategorySheetProps {
   isOpen: boolean;
   activeCategoryId: number | null;
   activeSuperCategoryId: number | null;
   onSelectCategory: (id: number | null) => void;
   onSelectSuperCategory: (id: number | null) => void;
   onClose: () => void;
}

function CategorySheet({
   isOpen,
   activeCategoryId,
   activeSuperCategoryId,
   onSelectCategory,
   onSelectSuperCategory,
   onClose,
}: CategorySheetProps) {
   const { data: categories } = useGetCategoriesQuery();
   const { data: categoryTree } = useGetCategoriesTreeQuery();

   // ── Standalone categories — no parent, not super ──────────────────────────
   const standaloneCategories = categories?.filter((c) => !c.is_super && c.parent_id === null) ?? [];

   return (
      <>
         {/* ── Backdrop ───────────────────────────────────────────────────────── */}
         {isOpen && <div className="fixed inset-0 bg-black/40 z-[55]" onClick={onClose} />}

         {/* ── Sheet ─────────────────────────────────────────────────────────── */}
         <div
            className={`fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl shadow-xl
transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
            style={{ maxHeight: "70vh", overflowY: "auto" }}
         >
            {/* ── Sheet Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
               <span className="font-semibold text-baltic-navy text-base">Категории</span>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700">
                  <X size={18} />
               </button>
            </div>

            {/* ── "All" Option ───────────────────────────────────────────────── */}
            <button
               onClick={() => {
                  onSelectCategory(null);
                  onSelectSuperCategory(null);
               }}
               className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 transition-colors
${activeCategoryId === null && activeSuperCategoryId === null ? "bg-amber/10 text-amber font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
            >
               Все категории
            </button>

            {/* ── Super Category Groups ──────────────────────────────────────── */}
            {categoryTree?.map((superCat) => (
               <div key={superCat.id}>
                  {/* ── Super Category Header Row ──────────────────────────────── */}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{superCat.name}</span>
                     {/* ── "Все" shortcut → filters by super category ────────────── */}
                     <button
                        onClick={() => {
                           onSelectSuperCategory(superCat.id);
                           onSelectCategory(null);
                        }}
                        className={`text-xs font-semibold transition-colors ${
                           activeSuperCategoryId === superCat.id ? "text-amber" : "text-gray-400 hover:text-amber"
                        }`}
                     >
                        Все
                     </button>
                  </div>

                  {/* ── Sub-category rows ──────────────────────────────────────── */}
                  {superCat.children.map((child) => (
                     <button
                        key={child.id}
                        onClick={() => {
                           onSelectCategory(child.id);
                           onSelectSuperCategory(null);
                        }}
                        className={`w-full text-left pl-8 pr-4 py-3 text-sm border-b border-gray-50
transition-colors ${
                           activeCategoryId === child.id
                              ? "bg-amber/10 text-amber font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                        }`}
                     >
                        {child.name}
                     </button>
                  ))}
               </div>
            ))}

            {/* ── Standalone Categories ──────────────────────────────────────── */}
            {standaloneCategories.length > 0 && (
               <>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Другие</span>
                  </div>
                  {standaloneCategories.map((cat) => (
                     <button
                        key={cat.id}
                        onClick={() => {
                           onSelectCategory(cat.id);
                           onSelectSuperCategory(null);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50
transition-colors ${
                           activeCategoryId === cat.id
                              ? "bg-amber/10 text-amber font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                        }`}
                     >
                        {cat.name}
                     </button>
                  ))}
               </>
            )}

            {/* ── Bottom padding — clears fixed BottomNav ────────────────────── */}
            <div className="h-20" />
         </div>
      </>
   );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function CatalogPage() {
   const [searchParams, setSearchParams] = useSearchParams();
   const { data: categories } = useGetCategoriesQuery();
   const { data: categoryTree } = useGetCategoriesTreeQuery();

   // ── Parse URL params ───────────────────────────────────────────────────────
   const q = searchParams.get("q") ?? undefined;
   const categoryParam = searchParams.get("category");
   const categoryId = categoryParam ? parseInt(categoryParam, 10) : undefined;
   const superParam = searchParams.get("super");
   const superCategoryId = superParam ? parseInt(superParam, 10) : undefined;
   const hasDiscount = searchParams.get("has_discount") === "true" ? true : undefined;
   const sort = (searchParams.get("sort") as ProductsQueryParams["sort"]) ?? "popular";

   // ── Local State ───────────────────────────────────────────────────────────
   const [page, setPage] = useState(1);
   const [allProducts, setAllProducts] = useState<Product[]>([]);
   const [isSheetOpen, setIsSheetOpen] = useState(false);

   // ── API Query ─────────────────────────────────────────────────────────────
   const queryParams: ProductsQueryParams = {
      q,
      category_id: categoryId,
      super_category_id: superCategoryId,
      has_discount: hasDiscount,
      sort,
      page,
      page_size: 20,
   };

   const { data, isLoading, isFetching } = useGetProductsQuery(queryParams);

   // ── Filter change → reset accumulated products ────────────────────────────
   const filterKey = JSON.stringify({ q, categoryId, superCategoryId, hasDiscount, sort });

   useEffect(() => {
      setPage(1);
      setAllProducts([]);
   }, [filterKey]);

   // ── Append/replace products when data arrives ─────────────────────────────
   useEffect(() => {
      if (!data?.items) return;
      if (page === 1) {
         setAllProducts(data.items);
      } else {
         setAllProducts((prev) => [...prev, ...data.items]);
      }
   }, [data]);

   // ── Derived values ─────────────────────────────────────────────────────────
   const activeCategory = categories?.find((c) => c.id === categoryId) ?? null;
   const activeSuperCat = categoryTree?.find((c) => c.id === superCategoryId) ?? null;
   const pageTitle = activeCategory?.name ?? activeSuperCat?.name ?? (hasDiscount ? "Акции" : "Каталог");
   const hasMore = data ? data.page < data.pages : false;
   const showLoadMore = hasMore && !isFetching;

   // ── URL update helpers ─────────────────────────────────────────────────────
   const setParam = useCallback(
      (key: string, value: string | null) => {
         setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value === null) {
               next.delete(key);
            } else {
               next.set(key, value);
            }
            return next;
         });
      },
      [setSearchParams]
   );

   const handleCategorySelect = (id: number | null) => {
      setParam("category", id !== null ? String(id) : null);
      setParam("super", null);
      setIsSheetOpen(false);
   };

   const handleSuperCategorySelect = (id: number | null) => {
      setParam("super", id !== null ? String(id) : null);
      setParam("category", null);
      setIsSheetOpen(false);
   };

   const handleSortSelect = (value: ProductsQueryParams["sort"]) => {
      setParam("sort", value === "popular" ? null : (value ?? null));
   };

   const handleLoadMore = () => {
      setPage((p) => p + 1);
   };

   // ── Filter button active state ─────────────────────────────────────────────
   const isFiltered = !!categoryId || !!superCategoryId;

   // ── Render ─────────────────────────────────────────────────────────────────
   return (
      <PageWrapper>
         <div className="px-4 pt-4 pb-6">
            {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
            <nav className="flex items-center gap-1 text-xs text-gray-400 mb-3">
               <Link to="/" className="hover:text-amber transition-colors">
                  Главная
               </Link>
               <ChevronRight size={12} />
               <Link to="/catalog" className="hover:text-amber transition-colors">
                  Каталог
               </Link>
               {(activeCategory || activeSuperCat) && (
                  <>
                     <ChevronRight size={12} />
                     <span className="text-gray-600">{activeCategory?.name ?? activeSuperCat?.name}</span>
                  </>
               )}
            </nav>

            {/* ── Page Title ───────────────────────────────────────────────────── */}
            <h1 className="text-xl font-bold text-baltic-navy font-heading mb-4">{pageTitle}</h1>

            {/* ── Filter / Sort Bar ────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
               {/* ── Categories Button ─────────────────────────────────────────── */}
               <button
                  onClick={() => setIsSheetOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
border whitespace-nowrap flex-shrink-0 transition-colors ${
                     isFiltered
                        ? "bg-amber text-white border-amber"
                        : "bg-white text-gray-700 border-gray-200 hover:border-amber"
                  }`}
               >
                  <SlidersHorizontal size={14} />
                  Категории
               </button>

               {/* ── Sort Pills ────────────────────────────────────────────────── */}
               {SORT_OPTIONS.map((opt) => (
                  <button
                     key={opt.value}
                     onClick={() => handleSortSelect(opt.value)}
                     className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap
flex-shrink-0 transition-colors ${
                        sort === opt.value
                           ? "bg-amber text-white border-amber"
                           : "bg-white text-gray-700 border-gray-200 hover:border-amber"
                     }`}
                  >
                     {opt.label}
                  </button>
               ))}
            </div>

            {/* ── Search hint ──────────────────────────────────────────────────── */}
            {q && (
               <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">
                     Поиск: <strong className="text-gray-800">«{q}»</strong>
                  </span>
                  <button onClick={() => setParam("q", null)} className="text-gray-400 hover:text-amber">
                     <X size={14} />
                  </button>
               </div>
            )}

            {/* ── Product Grid ─────────────────────────────────────────────────── */}
            {isLoading && page === 1 ? (
               <SkeletonGrid />
            ) : allProducts.length > 0 ? (
               <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                     {allProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                     ))}
                  </div>

                  {/* ── Load More ─────────────────────────────────────────────── */}
                  {isFetching && page > 1 && (
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="bg-card-bg rounded-2xl h-64 animate-pulse border border-gray-100" />
                        ))}
                     </div>
                  )}

                  {showLoadMore && (
                     <div className="mt-6 flex justify-center">
                        <button
                           onClick={handleLoadMore}
                           className="px-8 py-2.5 rounded-full border border-amber text-amber font-semibold
text-sm hover:bg-amber hover:text-white transition-colors"
                        >
                           Показать ещё
                        </button>
                     </div>
                  )}

                  {/* ── End of results ────────────────────────────────────────── */}
                  {!hasMore && allProducts.length > 0 && (
                     <p className="text-center text-xs text-gray-400 mt-6">
                        Показано {allProducts.length} из {data?.total} товаров
                     </p>
                  )}
               </>
            ) : !isLoading ? (
               /* ── Empty State ──────────────────────────────────────────────── */
               <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-4">🛒</div>
                  <p className="text-gray-500 text-sm font-medium">Товары не найdены</p>
                  <p className="text-gray-400 text-xs mt-1">Попробуйте изменить фильтры или поисковый запрос</p>
                  <button
                     onClick={() => setSearchParams({})}
                     className="mt-5 px-5 py-2 rounded-full bg-amber text-white text-sm font-semibold"
                  >
                     Сбросить фильтры
                  </button>
               </div>
            ) : null}
         </div>

         {/* ── Category Sheet ───────────────────────────────────────────────────── */}
         <CategorySheet
            isOpen={isSheetOpen}
            activeCategoryId={categoryId ?? null}
            activeSuperCategoryId={superCategoryId ?? null}
            onSelectCategory={handleCategorySelect}
            onSelectSuperCategory={handleSuperCategorySelect}
            onClose={() => setIsSheetOpen(false)}
         />
      </PageWrapper>
   );
}
