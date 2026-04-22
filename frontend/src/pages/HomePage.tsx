// ── Home Page ──────────────────────────────────────────────────────────────────
import { PageWrapper } from "../components/layout/PageWrapper";
import HeroBanner from "../components/ui/HeroBanner";
import PromoBanners from "../components/ui/PromoBanners";
import SectionHeader from "../components/ui/SectionHeader";
import ProductCard from "../components/ui/ProductCard";
import SubCategoryCard from "../components/ui/SubCategoryCard";
import { useGetProductsQuery, useGetCategoriesTreeQuery } from "../features/storefront/api";

// ── Product Grid ───────────────────────────────────────────────────────────────
function ProductGrid({ params }: { params: Parameters<typeof useGetProductsQuery>[0] }) {
   const { data, isLoading, isError } = useGetProductsQuery(params);

   if (isLoading) {
      return (
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="bg-card-bg rounded-xl h-64 animate-pulse" />
            ))}
         </div>
      );
   }

   if (isError || !data?.items.length) return null;

   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
         {data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
         ))}
      </div>
   );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function HomePage() {
   const { data: categoryTree } = useGetCategoriesTreeQuery();

   return (
      <PageWrapper>
         {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
         <HeroBanner />

         {/* ── Promo Banners ───────────────────────────────────────────────────── */}
         <PromoBanners />

         {/* ── Discounts Section ───────────────────────────────────────────────── */}
         <div className="mt-5">
            <SectionHeader title="Скидки" linkTo="/catalog?has_discount=true" />
            <ProductGrid params={{ has_discount: true, page_size: 6 }} />
         </div>

         {/* ── Super Category Sections ──────────────────────────────────────────── */}
         {categoryTree
            ?.filter((superCat) => superCat.children.length > 0)
            .map((superCat) => (
               <div key={superCat.id} className="mt-5">
                  {/* ── Section Header ──────────────────────────────────────────── */}
                  <SectionHeader
                     title={superCat.name}
                     linkTo={`/catalog?super=${superCat.id}`}
                     linkLabel="Смотреть все"
                  />

                  {/* ── Horizontal scrollable sub-category cards ────────────────── */}
                  <div
                     className="flex gap-3 px-4 overflow-x-auto pb-2"
                     style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                     {superCat.children.map((child) => (
                        <div key={child.id} className="flex-shrink-0 w-36">
                           <SubCategoryCard category={child} />
                        </div>
                     ))}
                  </div>
               </div>
            ))}

         {/* ── Best Sellers Section ─────────────────────────────────────────────── */}
         <div className="mt-5">
            <SectionHeader title="Хит продаж" linkTo="/catalog" />
            <ProductGrid params={{ page_size: 16 }} />
         </div>
      </PageWrapper>
   );
}
