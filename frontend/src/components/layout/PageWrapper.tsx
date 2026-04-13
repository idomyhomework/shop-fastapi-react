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
      <div className="bg-warm-paper min-h-screen">
         {/* ── Header ──────────────────────────────────────────────────────── */}
         <Header />

         {/* ── Category Pills ───────────────────────────────────────────────── */}
         {showCategoryPills && <CategoryPills />}

         {/* ── Page Content ─────────────────────────────────────────────────── */}
         {/* pb-20 prevents content from being hidden behind the fixed BottomNav */}
         <main className="pb-20">
            {children}
         </main>

         {/* ── Bottom Nav ───────────────────────────────────────────────────── */}
         <BottomNav />
      </div>
   );
}
