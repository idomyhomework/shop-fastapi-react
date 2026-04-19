// ── Category Pills ────────────────────────────────────────────────────────────
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetCategoriesQuery } from "../../features/storefront/api";

// ── CategoryPills ─────────────────────────────────────────────────────────────
export function CategoryPills() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();

   // ── Data ──────────────────────────────────────────────────────────────────
   const { data: categories, isLoading } = useGetCategoriesQuery();

   // ── Active Category ───────────────────────────────────────────────────────
   const activeCategoryId = searchParams.get("category") ? Number(searchParams.get("category")) : null;

   // ── Handlers ──────────────────────────────────────────────────────────────
   function handlePillClick(id: number) {
      navigate(`/catalog?category=${id}`);
   }

   if (isLoading || !categories?.length) return null;

   return (
      <div className="bg-paper-warm border-b">
         {/* ── Scrollable Row — fixed height, single line, horizontal scroll ─── */}
         <div
            className="flex flex-nowrap items-center gap-2 px-4 h-11 overflow-x-auto overflow-y-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
         >
            {categories.map((category) => {
               const isActive = category.id === activeCategoryId;
               return (
                  <button
                     key={category.id}
                     onClick={() => handlePillClick(category.id)}
                     className={[
                        "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium shadow-none",
                        isActive ? "bg-amber text-white" : "bg-white border border-gray-200 text-gray-700",
                     ].join(" ")}
                  >
                     {category.name}
                  </button>
               );
            })}
         </div>
      </div>
   );
}
