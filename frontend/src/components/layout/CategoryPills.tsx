// ── Category Pills ────────────────────────────────────────────────────────────
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetCategoriesQuery } from "../../features/storefront/api";

// ── CategoryPills ─────────────────────────────────────────────────────────────
export function CategoryPills() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();

   // ── Data — only super categories ─────────────────────────────────────────
   const { data: categories, isLoading } = useGetCategoriesQuery();
   const superCategories = categories?.filter((c) => c.is_super) ?? [];

   // ── Active super category from URL ────────────────────────────────────────
   const activeSuperParam = searchParams.get("super");
   const activeSuperCategoryId = activeSuperParam ? Number(activeSuperParam) : null;

   // ── Handlers ──────────────────────────────────────────────────────────────
   function handlePillClick(id: number) {
      navigate(`/catalog?super=${id}`);
   }

   if (isLoading || !superCategories.length) return null;

   return (
      <div className="bg-paper-warm border-b">
         {/* ── Scrollable Row — fixed height, single line, horizontal scroll ─── */}
         <div
            className="flex flex-nowrap items-center gap-2 px-4 h-11 overflow-x-auto overflow-y-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
         >
            {superCategories.map((category) => {
               const isActive = category.id === activeSuperCategoryId;
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
