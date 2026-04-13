// ── Storefront Header ─────────────────────────────────────────────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { openCart, selectCartItemCount } from "../../features/cart/slice";

// ── Header ────────────────────────────────────────────────────────────────────
export function Header() {
   const navigate   = useNavigate();
   const dispatch   = useAppDispatch();
   const itemCount  = useAppSelector(selectCartItemCount);

   // ── Search State ──────────────────────────────────────────────────────────
   const [query, setQuery] = useState("");

   // ── Handlers ─────────────────────────────────────────────────────────────
   function handleSearch() {
      navigate(`/catalog?q=${encodeURIComponent(query)}`);
   }

   function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") handleSearch();
   }

   return (
      <header className="sticky top-0 z-40 bg-white shadow-sm">
         <div className="px-4 h-14 flex items-center gap-3 max-w-screen-xl mx-auto">

            {/* ── Hamburger (mobile only) ──────────────────────────────────── */}
            <button
               aria-label="Открыть меню"
               className="flex md:hidden items-center justify-center w-9 h-9 rounded-md bg-transparent shadow-none text-baltic-navy p-0 shrink-0"
            >
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6"  x2="21" y2="6"  />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
               </svg>
            </button>

            {/* ── Logo ─────────────────────────────────────────────────────── */}
            <button
               onClick={() => navigate("/")}
               className="font-heading text-xl font-bold text-baltic-navy tracking-wide bg-transparent shadow-none p-0 shrink-0"
               aria-label="На главную"
            >
               Балтика
            </button>

            {/* ── Catalog Button (desktop only) ────────────────────────────── */}
            <button
               onClick={() => navigate("/catalog")}
               className="hidden md:flex items-center gap-2 bg-amber text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-none shrink-0"
            >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="6"  x2="21" y2="6"  />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
               </svg>
               Каталог
            </button>

            {/* ── Search Bar (desktop only) ────────────────────────────────── */}
            <div className="hidden md:flex flex-1 items-center border border-gray-200 rounded-xl overflow-hidden">
               <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKey}
                  placeholder="Начать поиск"
                  className="flex-1 px-4 py-2 text-sm outline-none border-none max-w-full shadow-none bg-transparent"
               />
               <button
                  onClick={handleSearch}
                  aria-label="Поиск"
                  className="px-3 py-2 bg-transparent text-gray-400 shadow-none"
               >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="11" cy="11" r="8" />
                     <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
               </button>
            </div>

            {/* ── Delivery Badge (desktop only) ────────────────────────────── */}
            <button className="hidden md:flex items-center gap-2 bg-amber text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-none shrink-0">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
               </svg>
               <div className="text-left leading-tight">
                  <div className="font-bold text-sm">ESP</div>
                  <div className="opacity-90 text-[10px]">Доставка или самовывоз</div>
               </div>
            </button>

            {/* ── Spacer (pushes right icons to end on mobile) ─────────────── */}
            <div className="flex-1 md:hidden" />

            {/* ── Wishlist Icon (desktop only) ─────────────────────────────── */}
            <button
               aria-label="Избранное"
               className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-500 bg-transparent shadow-none p-0 shrink-0"
            >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
               </svg>
            </button>

            {/* ── Profile Icon (desktop only) ──────────────────────────────── */}
            <button
               aria-label="Профиль"
               className="hidden md:flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-500 bg-transparent shadow-none p-0 shrink-0"
            >
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
               </svg>
            </button>

            {/* ── Cart Button ───────────────────────────────────────────────── */}
            {/* Desktop: full pill with label. Mobile: city badge + search icon */}
            <button
               onClick={() => dispatch(openCart())}
               aria-label="Корзина"
               className="hidden md:flex items-center gap-2 bg-amber text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-none shrink-0 relative"
            >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
               </svg>
               Корзина
               {itemCount > 0 && (
                  <span className="ml-1 bg-white text-amber text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                     {itemCount > 99 ? "99+" : itemCount}
                  </span>
               )}
            </button>

            {/* ── Mobile Controls ───────────────────────────────────────────── */}
            <div className="flex md:hidden items-center gap-2">
               {/* City Badge */}
               <span className="text-xs font-semibold bg-amber text-white px-2 py-1 rounded-full">ESP</span>
               {/* Search Icon */}
               <button
                  onClick={handleSearch}
                  aria-label="Поиск"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-amber text-white shadow-none p-0"
               >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="11" cy="11" r="8" />
                     <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
               </button>
            </div>

         </div>
      </header>
   );
}
