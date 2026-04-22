// ── Sub Category Card ──────────────────────────────────────────────────────────
import { useNavigate } from "react-router-dom";
import type { CategoryChild } from "../../features/storefront/types";

// ── Props ──────────────────────────────────────────────────────────────────────
interface SubCategoryCardProps {
   category: CategoryChild;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SubCategoryCard({ category }: SubCategoryCardProps) {
   const navigate = useNavigate();

   // ── Background color — fallback to neutral if null ─────────────────────────
   const bgColor = category.background_color ?? "#F5F5F5";

   return (
      <button
         onClick={() => navigate(`/catalog?category=${category.id}`)}
         className="w-full rounded-2xl overflow-hidden flex flex-col relative"
         style={{ backgroundColor: bgColor, aspectRatio: "1 / 1" }}
      >
         {/* ── Category Image ─────────────────────────────────────────────────── */}
         {category.image_url ? (
            <div className="flex-1 flex items-center justify-center p-3">
               <img src={category.image_url} alt={category.name} className="w-full h-full object-contain" />
            </div>
         ) : (
            <div className="flex-1" />
         )}

         {/* ── Category Name ──────────────────────────────────────────────────── */}
         <div className="px-3 pb-3 pt-1">
            <span className="text-sm font-medium text-gray-800 text-left line-clamp-2 block">{category.name}</span>
         </div>
      </button>
   );
}
