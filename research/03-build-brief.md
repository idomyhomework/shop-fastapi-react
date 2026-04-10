# Website Build Brief — BALTIKA

> Based on Phase 1 (brand extraction) + Phase 2 (competitor analysis)

---

## Design Direction

### Color Palette
| Role | Color | Hex | Rationale |
|------|-------|-----|-----------|
| Primary | Deep Baltic Navy | `#1C3557` | Keeps brand continuity with current navy; signals reliability |
| Accent | Amber Terracotta | `#D4572A` | Warmth, food, Eastern European warmth; beats Magnit's crimson |
| Background | Warm Paper | `#F8F5F0` | Premium but warm — beats clinical white; Cesta Selecta approach |
| Trust | Deep Forest Green | `#2C7A4B` | Delivery confirmations, "in stock" badges, trust signals |
| Dark Text | Charcoal | `#2C2C2C` | Readable, not harsh black |
| Muted Text | Warm Grey | `#8A8478` | Secondary copy, metadata |

### Typography
- **Headings:** Playfair Display (serif) — premium food brands, warmth + authority
- **Body / UI:** Inter (sans) — clean, modern, internationally readable
- **Russian accent text:** Same fonts render Cyrillic correctly

### Photography Style Guide
- Warm, close-up food photography (never product-on-white-background)
- Surfaces: natural wood, linen, slate, marble
- Hero subjects: herring in brine, dark rye bread, amber caviar, condensation on kvas glass, pelmeni with steam
- Color temperature: warm (not cool)
- No AI-generated food imagery — use real product photography

### Animation Recommendations
- Scroll-fade for section entries (opacity + translateY, 0.4s ease)
- Product card hover: lift + shadow (translateY -4px, shadow spread)
- CTA button hover: amber fill sweep
- Cart icon: count bubble scale animation on add
- Hero parallax: subtle (15%) on background image

### What to AVOID (competitor learnings)
- Electric/royal blue color schemes (cold, untrustworthy for food)
- Russian-only content (invisible to search, excludes mixed families)
- Product grid as the homepage hero (no emotional hook)
- Zero social proof in first scroll
- Carousel-only heroes with no text message
- Hiding free shipping info on a separate page

---

## Site Architecture

### Pages to Build

| Page | URL (ES) | Purpose |
|------|----------|---------|
| Homepage | `/` | Brand story + emotional hook + top categories + social proof |
| Tienda / Shop | `/tienda` | Full product catalog with filters |
| Category pages | `/tienda/[categoria]` | Per-category product grid |
| Product detail | `/tienda/[producto]` | Product page with full info |
| Envíos / Delivery | `/envios` | Delivery zones, costs, free threshold clearly explained |
| Sobre nosotros | `/sobre-nosotros` | Brand story, values, Ukraine solidarity note |
| Puntos de fidelidad | `/puntos` | Explain loyalty programme (100pts = 1€) |
| Contacto | `/contacto` | Phone, WhatsApp, email |

### Navigation Structure
```
[Logo]  Tienda  Envíos  Sobre nosotros  Puntos  |  🔍  🛒  [Lang: ES / RU]
```

### Content Hierarchy per Page

**Homepage:**
1. Hero — headline + subheadline + CTA + free shipping banner
2. Trust bar — "24h delivery" / "Cash on delivery" / "3,000+ products" / "Loyalty points"
3. Top categories — 6 visual category cards
4. Best sellers — product grid (12 items)
5. Brand story — 2-column text + food photography
6. Customer testimonials — 3 cards (collect from real customers)
7. Weekly offers / promotions
8. Delivery zone map/banner
9. Footer — categories, delivery, contact, social, language toggle

---

## CTA Strategy

| Page | Primary CTA | Secondary CTA |
|------|-------------|---------------|
| Homepage | "Comprar ahora" (→ shop) | "Ver envíos" |
| Shop | "Añadir al carrito" | "Ver detalles" |
| Product | "Añadir al carrito" | "Añadir a favoritos" |
| Delivery page | "Empezar compra" | — |
| Homepage hero | "Ver todos los productos" | "Ver ofertas" |

---

## Content Framework

### Homepage Headlines (3 options — pick one)
1. **"Los sabores de casa, entregados mañana."** *(primary recommendation)*
   - Subhead: "Más de 3.000 productos de Europa del Este. Envío a toda España en 24h."
2. **"Tu tienda de productos del Este. Toda España en 24h."**
   - Subhead: "Paga contra entrega en efectivo o con tarjeta. Sin suscripciones."
3. **"Lo que no encuentras en el super, lo encontrarás aquí."**
   - Subhead: "Arenque, pelmeni, tvorog, grechka, kolbasa — todo auténtico, entregado mañana."

### Value Proposition Structure (trust bar — 4 icons)
- `🚚` **Envío en 24h** — Toda España
- `💵` **Pago contra entrega** — Efectivo o tarjeta
- `🏆` **+3.000 productos** — De Ucrania, Rusia, Polonia y más
- `⭐` **Puntos de fidelidad** — 100 puntos = 1€

### Section-by-Section Copy Direction

**Brand Story section:**
Lead with Ukraine connection. BALTIKA supports `helpucrania.com`. This is emotionally resonant in 2026 — use it. Frame as: *"Somos más que una tienda. Llevamos años acercando los sabores de casa a los que viven lejos de ella."*

**Delivery section:**
Make free shipping the hero message:
- "¿Vives en Castellón, Valencia o Tarragona? Pedido +41€ → entrega gratis."
- "¿En Barcelona o Lleida? +51€ → gratis."
- Clear table format, not buried in prose.

### SEO Keyword Targets
Primary: `tienda productos rusos España`, `comprar comida rusa online`, `productos del este online España`
Secondary: `tvorog España`, `pelmeni comprar España`, `kéfir ruso`, `arenque malassolado España`, `caviar salmón comprar`
Long-tail: `productos ucranianos entrega domicilio España`, `kolbasa rusa España online`

---

## Conversion Playbook

### Primary Conversion Goal
Complete a cart and checkout (minimum €30 order)

### Lead Capture Strategy
- Newsletter popup: "10% descuento en tu primer pedido" (email capture)
- WhatsApp float button: instant human support (critical for Russian-speaking users)
- Loyalty programme signup prompt after first order

### Social Proof Plan
| Type | Location | Content |
|------|----------|---------|
| Customer testimonials | Homepage (3 cards) | Real names, cities, product they love |
| Star ratings | Product pages | Per-product review system |
| Order count | Trust bar | "Más de X pedidos completados" |
| Ukraine link | Header/footer | helpucrania.com — shows values |
| Product quality | About page | "Trabajamos con los mejores productores" |

### Trust Signal Checklist
- [x] Cash on delivery (zero purchase risk)
- [ ] Testimonials (collect from existing customers)
- [x] Phone number visible in header
- [ ] WhatsApp button
- [ ] SSL badge in footer
- [x] Visa/Mastercard logos
- [ ] "Verified" or quality badge from suppliers
- [ ] Google Reviews integration

---

## Technical Notes

### Language Strategy
- Primary language: **Spanish** (for SEO and new audience)
- Secondary: **Russian** (language toggle, full translation)
- URL structure: `/es/` and `/ru/` OR default ES with `/ru/` toggle
- Russian Cyrillic in Playfair Display / Inter — both support Cyrillic

### Platform Recommendation
Current OpenCart can be kept for the product/order backend. Build a new **static frontend** (or Next.js) that connects to the OpenCart API, OR migrate to **WooCommerce** / **Shopify** for a cleaner modern stack.

If staying on OpenCart: apply a custom theme (full rebuild of templates) rather than a theme switcher.

---

## Approval Questions for Client

Before building, please confirm:

1. **Language priority** — Should the new site default to Spanish with a Russian toggle, or remain Russian-first?
2. **Testimonials** — Can you provide 3 real customer quotes (name, city, what they love)?
3. **Photography** — Do you have any food/product photography assets, or do we source stock?
4. **Platform** — Stick with OpenCart backend + new frontend, or full platform migration?
5. **Ukraine messaging** — Happy to feature the helpucrania.com link prominently?
6. **WhatsApp** — Do you have a business WhatsApp number to add as a CTA?
