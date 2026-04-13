/** @type {import('tailwindcss').Config} */
export default {
   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
   theme: {
      extend: {
         // ── Brand Colors ────────────────────────────────────────────────────
         colors: {
            "baltic-navy": "#1C3557",
            amber: "#D4572A",
            "warm-paper": "#F8F5F0",
            "trust-green": "#2C7A4B",
            "card-bg": "#FFFFFF",
         },
         // ── Brand Fonts ─────────────────────────────────────────────────────
         fontFamily: {
            heading: ["Playfair Display", "Georgia", "serif"],
            body: ["Inter", "system-ui", "sans-serif"],
         },
      },
   },
   plugins: [],
};
