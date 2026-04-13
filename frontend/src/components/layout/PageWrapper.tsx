// ── Page Wrapper ──────────────────────────────────────────────────────────────
import type { ReactNode } from "react";
import { Header } from "./Header";
import { CategoryPills } from "./CategoryPills";
import { BottomNav } from "./BottomNav";

// ── Props ─────────────────────────────────────────────────────────────────────
interface PageWrapperProps {
   children: ReactNode;
   showCategoryPills?: boolean;
}

// ── PageWrapper ───────────────────────────────────────────────────────────────
export function PageWrapper({ children, showCategoryPills = true }: PageWrapperProps) {
   return (
      <div className="bg-warm-paper min-h-screen mx-0 m-auto">
         {/* ── Header ──────────────────────────────────────────────────────── */}
         <Header />

         {/* ── Category Pills ───────────────────────────────────────────────── */}
         {showCategoryPills && <CategoryPills />}

         {/* ── Page Content ─────────────────────────────────────────────────── */}
         {/* pb-20 prevents content from being hidden behind the fixed BottomNav */}
         <main className="pb-20">
            <div className="max-w-screen-xl mx-auto">
               {children}
            </div>
         </main>

         {/* ── Bottom Nav ───────────────────────────────────────────────────── */}
         <BottomNav />
      </div>
   );
}
