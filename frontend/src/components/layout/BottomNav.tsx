// ── Bottom Navigation ─────────────────────────────────────────────────────────
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { openCart, selectCartItemCount } from "../../features/cart/slice";

// ── Nav Tab Config ────────────────────────────────────────────────────────────
const NAV_TABS = [
   { id: "catalog", label: "Каталог", path: "/catalog" },
   { id: "promos", label: "Акции", path: "/catalog?has_discount=true" },
   { id: "cart", label: "", path: null }, // center cart button
   { id: "wishlist", label: "Избранное", path: "/wishlist" },
   { id: "profile", label: "Профиль", path: "/profile" },
] as const;

// ── BottomNav ─────────────────────────────────────────────────────────────────
export function BottomNav() {
   const navigate = useNavigate();
   const location = useLocation();
   const dispatch = useAppDispatch();
   const itemCount = useAppSelector(selectCartItemCount);

   // ── Helpers ───────────────────────────────────────────────────────────────
   function isActive(path: string | null) {
      if (!path) return false;
      return location.pathname === path.split("?")[0];
   }

   return (
      <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-200">
         <div className="flex items-center justify-around h-16 px-2">
            {NAV_TABS.map((tab) => {
               // ── Center Cart Button ────────────────────────────────────────
               if (tab.id === "cart") {
                  return (
                     <button
                        key="cart"
                        onClick={() => dispatch(openCart())}
                        aria-label="Корзина"
                        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-trust-green text-white shadow-md -mt-5 p-0"
                     >
                        {/* ── Cart Icon ─────────────────────────────────────── */}
                        <svg
                           width="24"
                           height="24"
                           viewBox="0 0 24 24"
                           fill="none"
                           stroke="currentColor"
                           strokeWidth="2"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                        >
                           <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                           <line x1="3" y1="6" x2="21" y2="6" />
                           <path d="M16 10a4 4 0 01-8 0" />
                        </svg>

                        {/* ── Item Count Badge ──────────────────────────────── */}
                        {itemCount > 0 && (
                           <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-baltic-navy text-white text-[10px] font-bold px-1">
                              {itemCount > 99 ? "99+" : itemCount}
                           </span>
                        )}
                     </button>
                  );
               }

               // ── Regular Tab ───────────────────────────────────────────────
               const active = isActive(tab.path);
               return (
                  <button
                     key={tab.id}
                     onClick={() => tab.path && navigate(tab.path)}
                     className={[
                        "flex flex-col items-center justify-center gap-0.5 flex-1 h-full bg-transparent shadow-none p-0 text-xs font-medium",
                        active ? "text-amber" : "text-gray-400",
                     ].join(" ")}
                  >
                     <NavIcon id={tab.id} />
                     <span>{tab.label}</span>
                  </button>
               );
            })}
         </div>
      </nav>
   );
}

// ── Nav Icons ─────────────────────────────────────────────────────────────────
function NavIcon({ id }: { id: string }) {
   const props = {
      width: 20,
      height: 20,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
   };

   if (id === "catalog") {
      return (
         <svg {...props}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
         </svg>
      );
   }

   if (id === "promos") {
      return (
         <svg {...props}>
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
         </svg>
      );
   }

   if (id === "wishlist") {
      return (
         <svg {...props}>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
         </svg>
      );
   }

   if (id === "profile") {
      return (
         <svg {...props}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
         </svg>
      );
   }

   return null;
}
