# BALTIKA — NanoBanana Pro/2 Image Generation Prompts

> **Workflow:** Image-to-image (img2img). Feed the existing internet product photo as the
> reference image. The prompt rewrites the background and lighting while preserving
> the exact product, packaging, label, and shape from the source image.
>
> **Output style:** Clean white background e-commerce product photography.
> All images: pure white (#FFFFFF) seamless background, soft diffused studio lighting,
> no props, no surfaces, no environment.

---

## HOW TO USE THESE PROMPTS

1. Find the existing product image online (competitor site, supplier, etc.)
2. Load it into NanoBanana Pro/2 as the **reference / img2img input**
3. Set **img2img strength:** `0.35–0.50` (preserve product shape, replace background)
4. Paste the corresponding prompt below
5. Add the **universal negative prompt** from the bottom of this file

---

## UNIVERSAL NEGATIVE PROMPT
> Apply this to every single generation.

```
colored background, wooden surface, marble surface, linen cloth, dark background,
gradient background, shadow on background, props, food styling, garnish, cutlery,
plates, bowls, text overlays, watermark, logo cropped, blurry product, distorted label,
distorted packaging, extra objects, reflections on background, dirty background,
warm tint on background, yellow cast, vignette, grain, noise, CGI plastic look
```

---

## 1. JARS & GLASS CONTAINERS
> Use for: pickled herring jars, caviar tins with glass, pickle jars, jam jars, kefir bottles

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME] in its
original packaging, pure white seamless background, soft diffused overhead and
front-fill studio lighting, subtle soft drop shadow directly beneath the container,
product label fully readable and sharp, glass transparency preserved, reflections
natural and clean, no background props, shot straight-on at slight 3/4 angle,
razor-sharp product, product centered in frame. Commercial food retail photography.
```

---

## 2. CARDBOARD BOXES & CARTONS
> Use for: pelmeni boxes, vareniki boxes, frozen food packaging, cereal boxes

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME] cardboard
packaging, pure white seamless background, soft box studio lighting from upper-left
and fill light from right, subtle soft drop shadow beneath the box, all sides of the
packaging visible in 3/4 angle view, packaging edges sharp and clean, print and text
on box fully legible, no background elements, product perfectly upright and centered.
Commercial grocery retail photography style.
```

---

## 3. FLEXIBLE POUCHES & VACUUM BAGS
> Use for: vacuum-packed sausage, frozen dumplings in plastic, smoked fish in pouch

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME] flexible
vacuum pouch, pure white seamless background, soft diffused studio lighting, subtle
soft shadow beneath the package, packaging wrinkles and texture visible naturally,
product shape clearly defined, front label sharp and fully readable, slight 5-degree
tilt for dynamic feel, centered in frame. Clean commercial food packaging photography.
```

---

## 4. BOTTLES (GLASS & PLASTIC)
> Use for: kvas bottles, kefir bottles, beet juice, sunflower oil, vinegar

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME] bottle,
pure white seamless background, soft studio lighting with subtle highlight on bottle
shoulder, thin natural reflection line on bottle body showing glass/plastic material,
label sharp and fully readable, bottle cap detail visible, minimal soft drop shadow
beneath base, shot straight-on centered. Commercial beverage retail photography.
```

---

## 5. CANNED TINS & METAL CONTAINERS
> Use for: fish tins, caviar tins, condensed milk tins, canned vegetables

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME] tin can,
pure white seamless background, soft diffused studio lighting with subtle metallic
sheen on can body preserved, lid rim sharp and clean, label or embossed print fully
legible, slight 3/4 angle to show depth of the container, subtle drop shadow beneath,
no props or environment, product centered and upright. Commercial grocery photography.
```

---

## 6. BREAD & BAKERY (WRAPPED)
> Use for: Borodinsky rye bread in packaging, wrapped pastries, bagged rolls

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME] in its
original packaging wrapper, pure white seamless background, soft even studio lighting
preserving packaging texture and material, wrapper print and barcode clearly visible,
product shape defined without distortion, subtle soft drop shadow beneath,
slight 3/4 angle, product centered. Clean commercial bakery packaging photography.
```

---

## 7. DAIRY PRODUCTS (TUBS, CUPS, BOTTLES)
> Use for: smetana tubs, tvorog containers, ryazhenka bottles, kefir packs

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME] dairy
container, pure white seamless background, soft clean studio lighting, subtle drop
shadow beneath container, lid and label sharp and fully readable, foil seal detail
visible if present, container upright and centered, slight 3/4 angle, no props,
no condensation effect, no moisture. Bright clean commercial dairy photography.
```

---

## 8. CONFECTIONERY & CHOCOLATE (BOXES & WRAPPERS)
> Use for: Mishka Kosolapy chocolates, wafer boxes, cookie packs, candy bags

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME] confectionery
packaging, pure white seamless background, soft diffused studio lighting, subtle drop
shadow beneath, packaging colors vivid and accurate, wrapper print fully sharp and
legible, slight 3/4 angle showing depth of box or bag, no background elements,
product centered. Commercial confectionery retail photography.
```

---

## 9. SPICES, CONDIMENTS & SMALL SACHETS
> Use for: mustard jars, adjika sauce, spice packets, small condiment tubes

```
Professional e-commerce product photography, studio shot of [PRODUCT NAME], pure white
seamless background, soft studio lighting with gentle highlight on product,
label or packaging print sharp and fully readable, product upright and steady,
subtle drop shadow beneath, centered frame. If small product: slightly zoomed in
so product fills 70% of frame. Clean commercial condiment photography.
```

---

## 10. MULTI-PACK / BUNDLE SHOTS
> Use for: 6-pack kefir, multipacks, gift sets, bundle deals

```
Professional e-commerce product photography, studio arranged group shot of [PRODUCT NAME]
multipack or bundle, pure white seamless background, all individual units visible and
legible, soft even studio lighting across all products, subtle collective drop shadow
beneath the group, clean symmetrical or slight diagonal arrangement,
no props, no background. Commercial retail bundle photography.
```

---

## Global Output Parameters

| Parameter | Value |
|-----------|-------|
| Background | Pure white `#FFFFFF` seamless |
| Lighting | Soft diffused studio (no harsh shadows) |
| Shadow | Subtle soft drop shadow directly beneath product only |
| Aspect ratio | 1:1 (square) for all product images |
| img2img strength | 0.35–0.50 (preserve product, replace environment) |
| Label fidelity | Always sharp, always readable |
| Angle | Straight-on or slight 3/4 — no top-down, no extreme angles |
| Props | None |
| Grain / texture on BG | None |
