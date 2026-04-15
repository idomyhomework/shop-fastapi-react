// ── Promo Banners ───────────────────────────────────────────────────────────────
import { useNavigate } from "react-router-dom";
// ── Banner Config ──────────────────────────────────────────────────────────────
const BANNERS = [
   {
      id: 1,
      headline: "Кэшбэк 5%",
      subtext: "На все покупки от 500 ₽",
      ctaTo: "/catalog",
      bgClass: "bg-gradient-to-br from-amber to-amber/70",
      icon: (
         <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
         >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
         </svg>
      ),
   },
   {
      id: 2,
      headline: "Карта лояльности",
      subtext: "Копите баллы — тратьте на скидки",
      ctaTo: "/catalog",
      bgClass: "bg-gradient-to-br from-baltic-navy to-baltic-navy/80",
      icon: (
         <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
         >
            <polygon
               points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7   
  14.14 2 9.27 8.91 8.26 12 2"
            />
         </svg>
      ),
   },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function PromoBanners() {
   const navigate = useNavigate();

   return (
      <div className="grid grid-cols-2 gap-3 mx-4 mt-3">
         {BANNERS.map((banner) => (
            <button
               key={banner.id}
               onClick={() => navigate(banner.ctaTo)}
               className={`${banner.bgClass} rounded-xl p-4 flex flex-col items-start gap-2       
  min-h-[100px] relative overflow-hidden text-left active:scale-95 transition-transform`}
            >
               {/* ── Icon ────────────────────────────────────────────────────── */}
               <div className="opacity-90">{banner.icon}</div>

               {/* ── Text ────────────────────────────────────────────────────── */}
               <div>
                  <p
                     className="text-white font-semibold text-sm
  leading-tight"
                  >
                     {banner.headline}
                  </p>
                  <p className="text-white/75 text-xs leading-snug mt-0.5">{banner.subtext}</p>
               </div>
            </button>
         ))}
      </div>
   );
}
