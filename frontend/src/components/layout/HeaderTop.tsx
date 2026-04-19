// ── Storefront Top Header ─────────────────────────────────────────────────────────
import { useState } from "react";

// ── Delivery info config ───────────────────────────────────────────────────────────
const CITIES = ["Валенсия", "Барселона", "Остальная Испания"] as const;

const DELIVERY_INFO: Record<(typeof CITIES)[number], string> = {
   Валенсия: "Доставка по средам · бесплатно от €50",
   Барселона: "Доставка по пятницам · бесплатно от €60",
   "Остальная Испания": "Доставка за 2–3 дня · от €11.80",
};

const CONTACT = {
   phone: "+34 691 683 619",
   aboutDeliveryLabel: "О доставке",
   helpLabel: "Помощь",
};

// ── HeaderTop ─────────────────────────────────────────────────────────────────────
export function HeaderTop() {
   // ── City cycle state ───────────────────────────────────────────────────────────
   const [cityIndex, setCityIndex] = useState(0);
   const currentCity = CITIES[cityIndex];

   function handleCityClick() {
      setCityIndex((prev) => (prev + 1) % CITIES.length);
   }

   return (
      <div className="hidden md:block w-full bg-baltic-navy text-white font-body text-sm">
         <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-9">
            {/* ── Left: city picker + delivery info ─────────────────────────── */}
            <div className="flex items-center gap-5">
               {/* City toggle */}
               <button
                  onClick={handleCityClick}
                  className="flex items-center gap-1 text-white/90 hover:text-white transition-colors cursor-pointer select-none"
               >
                  {/* Pin icon */}
                  <svg
                     className="w-3.5 h-3.5 shrink-0"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z"
                     />
                     <circle cx="12" cy="8" r="2" />
                  </svg>
                  <span>{currentCity}</span>
                  {/* Chevron */}
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
               </button>

               {/* Delivery info */}
               <div className="flex items-center gap-1.5 text-white/70">
                  {/* Truck icon */}
                  <svg
                     className="w-3.5 h-3.5 shrink-0"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path strokeLinecap="round" strokeLinejoin="round" d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
                     <circle cx="5.5" cy="18.5" r="1.5" />
                     <circle cx="18.5" cy="18.5" r="1.5" />
                  </svg>
                  <span>{DELIVERY_INFO[currentCity]}</span>
               </div>
            </div>

            {/* ── Right: nav links + phone ───────────────────────────────────── */}
            <div className="flex items-center gap-5 text-white/70">
               <a href="#" className="text-white hover:text-amber transition-colors">
                  {CONTACT.aboutDeliveryLabel}
               </a>
               <a href="#" className="text-white hover:text-amber transition-colors">
                  {CONTACT.helpLabel}
               </a>
               <a
                  href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-1 text-white hover:text-amber transition-colors"
               >
                  {/* Phone icon */}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M22 16.92v3a2 2 0 01-2.18 2A19.86 19.86 0 013.09 4.18 2 2 0 015.09 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                     />
                  </svg>
                  <span>{CONTACT.phone}</span>
               </a>
            </div>
         </div>
      </div>
   );
}
