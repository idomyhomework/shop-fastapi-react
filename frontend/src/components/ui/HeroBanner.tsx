// ── Hero Banner ────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Slide Type ─────────────────────────────────────────────────────────────────
interface BannerSlide {
   id: number;
   headline: string;
   subheading: string;
   ctaLabel: string;
   ctaTo: string;
   bgClass: string;
}

// ── Hardcoded Slides ───────────────────────────────────────────────────────────
const SLIDES: BannerSlide[] = [
   {
      id: 1,
      headline: "Свежие продукты каждый день",
      subheading: "Доставка прямо к вашей двери",
      ctaLabel: "Перейти",
      ctaTo: "/catalog",
      bgClass: "from-baltic-navy to-trust-green",
   },
   {
      id: 2,
      headline: "Скидки до 40% на сезонные товары",
      subheading: "Успейте купить по выгодной цене",
      ctaLabel: "Просмотреть",
      ctaTo: "/catalog?has_discount=true",
      bgClass: "from-amber to-baltic-navy",
   },
   {
      id: 3,
      headline: "Молочные продукты с фермы",
      subheading: "Натуральные и свежие каждое утро",
      ctaLabel: "Выбрать",
      ctaTo: "/catalog",
      bgClass: "from-trust-green to-baltic-navy",
   },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function HeroBanner() {
   const [current, setCurrent] = useState(0);
   const navigate = useNavigate();

   // ── Touch Swipe State ──────────────────────────────────────────────────────
   const touchStartX = useRef<number | null>(null);

   // ── Timer Ref (so we can restart it on manual navigation) ─────────────────
   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

   // ── Start / Restart Auto-play ──────────────────────────────────────────────
   const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
         setCurrent((prev) => (prev + 1) % SLIDES.length);
      }, 10000);
   };

   // ── Auto-play ──────────────────────────────────────────────────────────────
   useEffect(() => {
      startTimer();
      return () => {
         if (timerRef.current) clearInterval(timerRef.current);
      };
   }, []);

   // ── Manual Navigation ──────────────────────────────────────────────────────
   const goTo = (index: number) => {
      setCurrent(index);
      startTimer();
   };

   // ── Touch Handlers ─────────────────────────────────────────────────────────
   const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
   };

   const handleTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const delta = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(delta) > 50) {
         goTo(delta > 0 ? (current + 1) % SLIDES.length : (current - 1 + SLIDES.length) % SLIDES.length);
      }
      touchStartX.current = null;
   };

   // ── Render ─────────────────────────────────────────────────────────────────
   return (
      <div
         className="relative mx-4 mt-3 rounded-xl overflow-hidden h-44"
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}
      >
         {/* ── Slides Track ──────────────────────────────────────────────────────── */}
         <div
            className="flex h-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
         >
            {SLIDES.map((slide) => (
               <div
                  key={slide.id}
                  className={`min-w-full h-full flex flex-col justify-end p-5 bg-gradient-to-br ${slide.bgClass}`}
               >
                  {/* ── Slide Content ──────────────────────────────────────────────── */}
                  <h3 className="text-white font-heading font-bold text-lg leading-tight mb-0.5">{slide.headline}</h3>
                  <p className="text-white/80 text-sm mb-3">{slide.subheading}</p>

                  {/* ── CTA Button ────────────────────────────────────────────────── */}
                  <button
                     onClick={() => navigate(slide.ctaTo)}
                     className="self-start bg-white text-baltic-navy text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors"
                  >
                     {slide.ctaLabel}
                  </button>
               </div>
            ))}
         </div>

         {/* ── Dot Indicators ────────────────────────────────────────────────────── */}
         <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
               <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="flex items-center justify-center p-1 bg-transparent"
                  aria-label={`Слайд ${i + 1}`}
               >
                  <span
                     className={`block rounded-full transition-all duration-300 ${
                        i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"
                     }`}
                  />
               </button>
            ))}
         </div>
      </div>
   );
}
