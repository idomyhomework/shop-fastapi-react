// ── Page Wrapper ──────────────────────────────────────────────────────────────
import type { ReactNode } from "react";
import { Header } from "./Header";
import { CategoryPills } from "./CategoryPills";
import { BottomNav } from "./BottomNav";
import { HeaderTop } from "./HeaderTop";

// ── Props ─────────────────────────────────────────────────────────────────────
interface PageWrapperProps {
   children: ReactNode;
   showCategoryPills?: boolean;
}

// ── PageWrapper ───────────────────────────────────────────────────────────────
export function PageWrapper({ children, showCategoryPills = true }: PageWrapperProps) {
   return (
      <>
         {/* ── HeaderTop: full-width, outside constrained wrapper ──────────── */}
         <HeaderTop />
         {/* ── Header ──────────────────────────────────────────────────────── */}
         <Header />

         {/* ── Category Pills ───────────────────────────────────────────────── */}
         {showCategoryPills && <CategoryPills />}
         <div className="bg-warm-paper min-h-screen max-w-screen-xl mx-auto">
            {/* ── Page Content ─────────────────────────────────────────────────── */}
            {/* pb-20 prevents content from being hidden behind the fixed BottomNav */}
            <main className="pb-20">{children}</main>
         </div>
         {/* ── Bottom Nav ───────────────────────────────────────────────────── */}
         <BottomNav />
      </>
   );
}
