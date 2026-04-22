# Código — Super Categories Section

---

## 1. `backend/app/services/product_service.py`

Añadir `super_category_id` como parámetro y su filtro. Usar `elif` para evitar doble join cuando `category_id` y `super_category_id` son mutuamente excluyentes.

```python
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app import models, schemas
from app.models import Product
from app.models import Category
from datetime import datetime, timezone


class ProductService:

    # ── Get products ──────────────────────────────────────────────────────────
    @staticmethod
    async def get_products(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 25,
        q: Optional[str] = None,
        bar_code: Optional[str] = None,
        is_active: Optional[bool] = None,
        stock: Optional[int] = None,
        price: Optional[float] = None,
        category_id: Optional[int] = None,
        super_category_id: Optional[int] = None,
        has_discount: Optional[bool] = None,
        sort: Optional[str] = None,
    ) -> schemas.ProductListResponse:

        query = select(Product)

        if q:
            query = query.where(Product.name.ilike(f"%{q}%"))

        if bar_code:
            query = query.where(Product.bar_code == bar_code)

        if is_active is not None:
            query = query.where(Product.is_active == is_active)

        if stock is not None:
            query = query.where(Product.stock_quantity == stock)

        if price is not None:
            query = query.where(Product.price == price)

        if has_discount is not None:
            query = query.where(Product.has_discount == has_discount)

        # ── Category filters (mutually exclusive — avoid double join) ─────────
        if category_id is not None:
            query = query.join(Product.categories).where(Category.id == category_id)
        elif super_category_id is not None:
            query = query.join(Product.categories).where(Category.parent_id == super_category_id)

        # ── Sort ──────────────────────────────────────────────────────────────
        if sort == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort == "price_desc":
            query = query.order_by(Product.price.desc())
        else:
            # Default / "popular": newest first by id
            query = query.order_by(Product.id.desc())

        # ── Total y paginación ────────────────────────────────────────────────
        count_query = select(func.count()).select_from(query.subquery())
        total_result = (await db.execute(count_query)).scalar_one()
        query = (
            query.options(
                selectinload(Product.categories),
                selectinload(Product.images),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await db.execute(query)
        items = result.scalars().all()

        pages = (total_result + page_size - 1) // page_size

        return {
            "items": items,
            "total": total_result,
            "page": page,
            "page_size": page_size,
            "pages": pages,
        }

    # ── Create product ────────────────────────────────────────────────────────
    @staticmethod
    async def create(db: AsyncSession, data: schemas.ProductCreate):
        query = select(Product).where(Product.bar_code == data.bar_code)
        result = await db.execute(query)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un producto con ese codigo de barra",
            )

        cat_query = select(Category).where(Category.id.in_(data.category_ids))
        cat_result = await db.execute(cat_query)
        categories_from_db = cat_result.scalars().all()

        if len(categories_from_db) != len(data.category_ids):
            raise HTTPException(
                status_code=400, detail="Una o más categorías no existen"
            )

        product_data = (
            data.model_dump(exclude={"category_ids"})
            if hasattr(data, "model_dump")
            else data.dict(exclude={"category_ids"})
        )

        product_model = Product(**product_data)
        product_model.categories = list(categories_from_db)

        db.add(product_model)
        await db.commit()
        await db.refresh(product_model)

        query_full = (
            select(models.Product)
            .options(
                selectinload(models.Product.categories),
                selectinload(models.Product.images),
            )
            .where(models.Product.id == product_model.id)
        )

        result_full = await db.execute(query_full)
        return result_full.scalar_one()

    # ── Update product ────────────────────────────────────────────────────────
    @staticmethod
    async def update(db: AsyncSession, id: int, data: schemas.ProductUpdate):
        query = (
            select(models.Product)
            .options(
                selectinload(models.Product.categories),
                selectinload(models.Product.images),
            )
            .where(models.Product.id == id)
        )
        result = await db.execute(query)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        if data.bar_code and product.bar_code != data.bar_code:
            exist_bc_query = select(models.Product).where(
                models.Product.bar_code == data.bar_code
            )
            exist_bc_result = await db.execute(exist_bc_query)
            if exist_bc_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un producto con ese codigo de barra",
                )

        obj_data = (
            data.model_dump(exclude_unset=True)
            if hasattr(data, "model_dump")
            else data.dict(exclude_unset=True)
        )

        if "category_ids" in obj_data:
            cat_ids = obj_data.pop("category_ids")
            cat_query = select(models.Category).where(models.Category.id.in_(cat_ids))
            cat_result = await db.execute(cat_query)
            categories = cat_result.scalars().all()
            if len(categories) != len(cat_ids):
                raise HTTPException(
                    status_code=400, detail="Una o más categorías no existen"
                )
            product.categories = list(categories)

        for key, value in obj_data.items():
            setattr(product, key, value)

        await db.commit()
        await db.refresh(product)
        return product

    # ── Delete product ────────────────────────────────────────────────────────
    @staticmethod
    async def delete(db: AsyncSession, id: int) -> List[str]:
        query = (
            select(Product)
            .options(selectinload(Product.images))
            .where(Product.id == id)
        )
        result = await db.execute(query)
        product_to_delete = result.scalar_one_or_none()

        if not product_to_delete:
            raise HTTPException(status_code=404, detail="El producto no existe.")

        image_urls = [img.image_url for img in product_to_delete.images]

        await db.delete(product_to_delete)
        await db.commit()

        return image_urls

    # ── Toggle active ─────────────────────────────────────────────────────────
    @staticmethod
    async def toggle_active(db: AsyncSession, id: int):
        query = select(Product).where(Product.id == id)
        result = await db.execute(query)
        product = result.scalar_one_or_none()
        if product is None:
            raise HTTPException(status_code=404, detail="Producto no enconrado.")

        product.is_active = not product.is_active
        await db.commit()
        await db.refresh(product)

        return product
```

---

## 2. `backend/app/routers/storefront.py`

Añadir `super_category_id` query param y pasarlo al servicio.

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from app.services.product_service import ProductService
from app.services.category_service import CategoryService
from app import schemas
from app.database import get_db
from typing import Optional, Literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Product
from sqlalchemy.orm import selectinload

# ── Router ─────────────────────────────────────────────────────────────────
router = APIRouter()


# ── Get public product listing ─────────────────────────────────────────────
@router.get("/products", response_model=schemas.ProductListResponse)
async def get_public_products(
    q: Optional[str] = Query(default=None, description="Buscar en nombre del producto"),
    bar_code: Optional[str] = Query(default=None, description="Código de barras exacto"),
    stock: Optional[int] = Query(default=None, ge=0, description="Stock exacto"),
    price: Optional[float] = Query(default=None, ge=0, description="Precio exacto"),
    category_id: Optional[int] = Query(default=None, ge=1, description="Filtrar por categoría"),
    super_category_id: Optional[int] = Query(default=None, ge=1, description="Filtrar por super categoría"),
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(default=25, ge=1, le=100, description="Productos por página"),
    has_discount: Optional[bool] = Query(default=None, description="Filtrar por productos descontados"),
    sort: Optional[Literal["popular", "price_asc", "price_desc"]] = Query(default="popular"),
    db: AsyncSession = Depends(get_db),
) -> schemas.ProductListResponse:
    return await ProductService.get_products(
        db=db,
        page=page,
        page_size=page_size,
        q=q,
        bar_code=bar_code,
        is_active=True,
        stock=stock,
        price=price,
        category_id=category_id,
        super_category_id=super_category_id,
        has_discount=has_discount,
        sort=sort,
    )


# ── Get category tree (super cats + children) ───────────────────────────────
@router.get("/categories/tree", response_model=list[schemas.CategoryTree])
async def get_categories_tree(db: AsyncSession = Depends(get_db)):
    return await CategoryService.get_category_tree(db)


# ── Get public categories listing ───────────────────────────────────────────
@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    return await CategoryService.get_all(db)


# ── Get a specific product publicly ─────────────────────────────────────────
@router.get("/products/{id}", response_model=schemas.ProductRead)
async def get_product_publicaly(id: int, db: AsyncSession = Depends(get_db)):
    query = (
        select(Product)
        .options(
            selectinload(Product.categories),
            selectinload(Product.images),
        )
        .where(Product.id == id)
    )
    result = await db.execute(query)
    product = result.scalar_one_or_none()

    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product
```

---

## 3. `frontend/src/components/ui/SubCategoryCard.tsx` *(nuevo archivo)*

```tsx
// ── Sub Category Card ──────────────────────────────────────────────────────────
import { useNavigate } from "react-router-dom";
import type { CategoryChild } from "../../features/storefront/types";

// ── Props ──────────────────────────────────────────────────────────────────────
interface SubCategoryCardProps {
   category: CategoryChild;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SubCategoryCard({ category }: SubCategoryCardProps) {
   const navigate = useNavigate();

   // ── Background color — fallback to neutral if null ─────────────────────────
   const bgColor = category.background_color ?? "#F5F5F5";

   return (
      <button
         onClick={() => navigate(`/catalog?category=${category.id}`)}
         className="w-full rounded-2xl overflow-hidden flex flex-col relative"
         style={{ backgroundColor: bgColor, aspectRatio: "1 / 1" }}
      >
         {/* ── Category Image ─────────────────────────────────────────────────── */}
         {category.image_url ? (
            <div className="flex-1 flex items-center justify-center p-3">
               <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-contain"
               />
            </div>
         ) : (
            <div className="flex-1" />
         )}

         {/* ── Category Name ──────────────────────────────────────────────────── */}
         <div className="px-3 pb-3 pt-1">
            <span className="text-sm font-medium text-gray-800 text-left line-clamp-2 block">
               {category.name}
            </span>
         </div>
      </button>
   );
}
```

---

## 4. `frontend/src/pages/HomePage.tsx`

Añadir secciones de super categorías entre "Скидки" y "Хит продаж".

```tsx
// ── Home Page ──────────────────────────────────────────────────────────────────
import { PageWrapper } from "../components/layout/PageWrapper";
import HeroBanner from "../components/ui/HeroBanner";
import PromoBanners from "../components/ui/PromoBanners";
import SectionHeader from "../components/ui/SectionHeader";
import ProductCard from "../components/ui/ProductCard";
import SubCategoryCard from "../components/ui/SubCategoryCard";
import { useGetProductsQuery, useGetCategoriesTreeQuery } from "../features/storefront/api";

// ── Product Grid ───────────────────────────────────────────────────────────────
function ProductGrid({ params }: { params: Parameters<typeof useGetProductsQuery>[0] }) {
   const { data, isLoading, isError } = useGetProductsQuery(params);

   if (isLoading) {
      return (
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="bg-card-bg rounded-xl h-64 animate-pulse" />
            ))}
         </div>
      );
   }

   if (isError || !data?.items.length) return null;

   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
         {data.items.map((product) => (
            <ProductCard key={product.id} product={product} />
         ))}
      </div>
   );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function HomePage() {
   const { data: categoryTree } = useGetCategoriesTreeQuery();

   return (
      <PageWrapper>
         {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
         <HeroBanner />

         {/* ── Promo Banners ───────────────────────────────────────────────────── */}
         <PromoBanners />

         {/* ── Discounts Section ───────────────────────────────────────────────── */}
         <div className="mt-5">
            <SectionHeader title="Скидки" linkTo="/catalog?has_discount=true" />
            <ProductGrid params={{ has_discount: true, page_size: 6 }} />
         </div>

         {/* ── Super Category Sections ──────────────────────────────────────────── */}
         {categoryTree
            ?.filter((superCat) => superCat.children.length > 0)
            .map((superCat) => (
               <div key={superCat.id} className="mt-5">
                  {/* ── Section Header ──────────────────────────────────────────── */}
                  <SectionHeader
                     title={superCat.name}
                     linkTo={`/catalog?super=${superCat.id}`}
                     linkLabel="Смотреть все"
                  />

                  {/* ── Horizontal scrollable sub-category cards ────────────────── */}
                  <div
                     className="flex gap-3 px-4 overflow-x-auto pb-2"
                     style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                     {superCat.children.map((child) => (
                        <div key={child.id} className="flex-shrink-0 w-36">
                           <SubCategoryCard category={child} />
                        </div>
                     ))}
                  </div>
               </div>
            ))}

         {/* ── Best Sellers Section ─────────────────────────────────────────────── */}
         <div className="mt-5">
            <SectionHeader title="Хит продаж" linkTo="/catalog" />
            <ProductGrid params={{ page_size: 16 }} />
         </div>
      </PageWrapper>
   );
}
```

---

## 5. `frontend/src/components/layout/CategoryPills.tsx`

Filtrar a solo super categorías y usar `?super=` param.

```tsx
// ── Category Pills ────────────────────────────────────────────────────────────
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetCategoriesQuery } from "../../features/storefront/api";

// ── CategoryPills ─────────────────────────────────────────────────────────────
export function CategoryPills() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();

   // ── Data — only super categories ─────────────────────────────────────────
   const { data: categories, isLoading } = useGetCategoriesQuery();
   const superCategories = categories?.filter((c) => c.is_super) ?? [];

   // ── Active super category from URL ────────────────────────────────────────
   const activeSuperParam = searchParams.get("super");
   const activeSuperCategoryId = activeSuperParam ? Number(activeSuperParam) : null;

   // ── Handlers ──────────────────────────────────────────────────────────────
   function handlePillClick(id: number) {
      navigate(`/catalog?super=${id}`);
   }

   if (isLoading || !superCategories.length) return null;

   return (
      <div className="bg-paper-warm border-b">
         {/* ── Scrollable Row — fixed height, single line, horizontal scroll ─── */}
         <div
            className="flex flex-nowrap items-center gap-2 px-4 h-11 overflow-x-auto overflow-y-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
         >
            {superCategories.map((category) => {
               const isActive = category.id === activeSuperCategoryId;
               return (
                  <button
                     key={category.id}
                     onClick={() => handlePillClick(category.id)}
                     className={[
                        "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium shadow-none",
                        isActive ? "bg-amber text-white" : "bg-white border border-gray-200 text-gray-700",
                     ].join(" ")}
                  >
                     {category.name}
                  </button>
               );
            })}
         </div>
      </div>
   );
}
```

---

## 6. `frontend/src/pages/CatalogPage.tsx`

Añadir soporte para `?super=`, `super_category_id` en la query, título/breadcrumb correcto y sidebar de dos niveles.

```tsx
// ── Catalog Page ───────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, ChevronRight, X } from "lucide-react";
import { PageWrapper } from "../components/layout/PageWrapper";
import ProductCard from "../components/ui/ProductCard";
import {
   useGetProductsQuery,
   useGetCategoriesQuery,
   useGetCategoriesTreeQuery,
} from "../features/storefront/api";
import type { Product, ProductsQueryParams } from "../features/storefront/types";

// ── Sort Options ───────────────────────────────────────────────────────────────
const SORT_OPTIONS: { label: string; value: ProductsQueryParams["sort"] }[] = [
   { label: "По популярности", value: "popular" },
   { label: "Цена ↑", value: "price_asc" },
   { label: "Цена ↓", value: "price_desc" },
];

// ── Skeleton Grid ──────────────────────────────────────────────────────────────
function SkeletonGrid() {
   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
         {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card-bg rounded-2xl h-64 animate-pulse border border-gray-100" />
         ))}
      </div>
   );
}

// ── Category Sheet ─────────────────────────────────────────────────────────────
interface CategorySheetProps {
   isOpen: boolean;
   activeCategoryId: number | null;
   activeSuperCategoryId: number | null;
   onSelectCategory: (id: number | null) => void;
   onSelectSuperCategory: (id: number | null) => void;
   onClose: () => void;
}

function CategorySheet({
   isOpen,
   activeCategoryId,
   activeSuperCategoryId,
   onSelectCategory,
   onSelectSuperCategory,
   onClose,
}: CategorySheetProps) {
   const { data: categories } = useGetCategoriesQuery();
   const { data: categoryTree } = useGetCategoriesTreeQuery();

   // ── Standalone categories — no parent, not super ──────────────────────────
   const standaloneCategories = categories?.filter((c) => !c.is_super && c.parent_id === null) ?? [];

   return (
      <>
         {/* ── Backdrop ───────────────────────────────────────────────────────── */}
         {isOpen && <div className="fixed inset-0 bg-black/40 z-[55]" onClick={onClose} />}

         {/* ── Sheet ─────────────────────────────────────────────────────────── */}
         <div
            className={`fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl shadow-xl
transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
            style={{ maxHeight: "70vh", overflowY: "auto" }}
         >
            {/* ── Sheet Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
               <span className="font-semibold text-baltic-navy text-base">Категории</span>
               <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700">
                  <X size={18} />
               </button>
            </div>

            {/* ── "All" Option ───────────────────────────────────────────────── */}
            <button
               onClick={() => { onSelectCategory(null); onSelectSuperCategory(null); }}
               className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 transition-colors
${activeCategoryId === null && activeSuperCategoryId === null ? "bg-amber/10 text-amber font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
            >
               Все категории
            </button>

            {/* ── Super Category Groups ──────────────────────────────────────── */}
            {categoryTree?.map((superCat) => (
               <div key={superCat.id}>
                  {/* ── Super Category Header Row ──────────────────────────────── */}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {superCat.name}
                     </span>
                     {/* ── "Все" shortcut → filters by super category ────────────── */}
                     <button
                        onClick={() => { onSelectSuperCategory(superCat.id); onSelectCategory(null); }}
                        className={`text-xs font-semibold transition-colors ${
                           activeSuperCategoryId === superCat.id
                              ? "text-amber"
                              : "text-gray-400 hover:text-amber"
                        }`}
                     >
                        Все
                     </button>
                  </div>

                  {/* ── Sub-category rows ──────────────────────────────────────── */}
                  {superCat.children.map((child) => (
                     <button
                        key={child.id}
                        onClick={() => { onSelectCategory(child.id); onSelectSuperCategory(null); }}
                        className={`w-full text-left pl-8 pr-4 py-3 text-sm border-b border-gray-50
transition-colors ${
                           activeCategoryId === child.id
                              ? "bg-amber/10 text-amber font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                        }`}
                     >
                        {child.name}
                     </button>
                  ))}
               </div>
            ))}

            {/* ── Standalone Categories ──────────────────────────────────────── */}
            {standaloneCategories.length > 0 && (
               <>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Другие
                     </span>
                  </div>
                  {standaloneCategories.map((cat) => (
                     <button
                        key={cat.id}
                        onClick={() => { onSelectCategory(cat.id); onSelectSuperCategory(null); }}
                        className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50
transition-colors ${
                           activeCategoryId === cat.id
                              ? "bg-amber/10 text-amber font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                        }`}
                     >
                        {cat.name}
                     </button>
                  ))}
               </>
            )}

            {/* ── Bottom padding — clears fixed BottomNav ────────────────────── */}
            <div className="h-20" />
         </div>
      </>
   );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function CatalogPage() {
   const [searchParams, setSearchParams] = useSearchParams();
   const { data: categories } = useGetCategoriesQuery();
   const { data: categoryTree } = useGetCategoriesTreeQuery();

   // ── Parse URL params ───────────────────────────────────────────────────────
   const q = searchParams.get("q") ?? undefined;
   const categoryParam = searchParams.get("category");
   const categoryId = categoryParam ? parseInt(categoryParam, 10) : undefined;
   const superParam = searchParams.get("super");
   const superCategoryId = superParam ? parseInt(superParam, 10) : undefined;
   const hasDiscount = searchParams.get("has_discount") === "true" ? true : undefined;
   const sort = (searchParams.get("sort") as ProductsQueryParams["sort"]) ?? "popular";

   // ── Local State ───────────────────────────────────────────────────────────
   const [page, setPage] = useState(1);
   const [allProducts, setAllProducts] = useState<Product[]>([]);
   const [isSheetOpen, setIsSheetOpen] = useState(false);

   // ── API Query ─────────────────────────────────────────────────────────────
   const queryParams: ProductsQueryParams = {
      q,
      category_id: categoryId,
      super_category_id: superCategoryId,
      has_discount: hasDiscount,
      sort,
      page,
      page_size: 20,
   };

   const { data, isLoading, isFetching } = useGetProductsQuery(queryParams);

   // ── Filter change → reset accumulated products ────────────────────────────
   const filterKey = JSON.stringify({ q, categoryId, superCategoryId, hasDiscount, sort });

   useEffect(() => {
      setPage(1);
      setAllProducts([]);
   }, [filterKey]);

   // ── Append/replace products when data arrives ─────────────────────────────
   useEffect(() => {
      if (!data?.items) return;
      if (page === 1) {
         setAllProducts(data.items);
      } else {
         setAllProducts((prev) => [...prev, ...data.items]);
      }
   }, [data]);

   // ── Derived values ─────────────────────────────────────────────────────────
   const activeCategory = categories?.find((c) => c.id === categoryId) ?? null;
   const activeSuperCat = categoryTree?.find((c) => c.id === superCategoryId) ?? null;
   const pageTitle =
      activeCategory?.name ?? activeSuperCat?.name ?? (hasDiscount ? "Акции" : "Каталог");
   const hasMore = data ? data.page < data.pages : false;
   const showLoadMore = hasMore && !isFetching;

   // ── URL update helpers ─────────────────────────────────────────────────────
   const setParam = useCallback(
      (key: string, value: string | null) => {
         setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value === null) {
               next.delete(key);
            } else {
               next.set(key, value);
            }
            return next;
         });
      },
      [setSearchParams]
   );

   const handleCategorySelect = (id: number | null) => {
      setParam("category", id !== null ? String(id) : null);
      setParam("super", null);
      setIsSheetOpen(false);
   };

   const handleSuperCategorySelect = (id: number | null) => {
      setParam("super", id !== null ? String(id) : null);
      setParam("category", null);
      setIsSheetOpen(false);
   };

   const handleSortSelect = (value: ProductsQueryParams["sort"]) => {
      setParam("sort", value === "popular" ? null : (value ?? null));
   };

   const handleLoadMore = () => {
      setPage((p) => p + 1);
   };

   // ── Filter button active state ─────────────────────────────────────────────
   const isFiltered = !!categoryId || !!superCategoryId;

   // ── Render ─────────────────────────────────────────────────────────────────
   return (
      <PageWrapper>
         <div className="px-4 pt-4 pb-6">
            {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
            <nav className="flex items-center gap-1 text-xs text-gray-400 mb-3">
               <Link to="/" className="hover:text-amber transition-colors">
                  Главная
               </Link>
               <ChevronRight size={12} />
               <Link to="/catalog" className="hover:text-amber transition-colors">
                  Каталог
               </Link>
               {(activeCategory || activeSuperCat) && (
                  <>
                     <ChevronRight size={12} />
                     <span className="text-gray-600">
                        {activeCategory?.name ?? activeSuperCat?.name}
                     </span>
                  </>
               )}
            </nav>

            {/* ── Page Title ───────────────────────────────────────────────────── */}
            <h1 className="text-xl font-bold text-baltic-navy font-heading mb-4">{pageTitle}</h1>

            {/* ── Filter / Sort Bar ────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
               {/* ── Categories Button ─────────────────────────────────────────── */}
               <button
                  onClick={() => setIsSheetOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
border whitespace-nowrap flex-shrink-0 transition-colors ${
                     isFiltered
                        ? "bg-amber text-white border-amber"
                        : "bg-white text-gray-700 border-gray-200 hover:border-amber"
                  }`}
               >
                  <SlidersHorizontal size={14} />
                  Категории
               </button>

               {/* ── Sort Pills ────────────────────────────────────────────────── */}
               {SORT_OPTIONS.map((opt) => (
                  <button
                     key={opt.value}
                     onClick={() => handleSortSelect(opt.value)}
                     className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap
flex-shrink-0 transition-colors ${
                        sort === opt.value
                           ? "bg-amber text-white border-amber"
                           : "bg-white text-gray-700 border-gray-200 hover:border-amber"
                     }`}
                  >
                     {opt.label}
                  </button>
               ))}
            </div>

            {/* ── Search hint ──────────────────────────────────────────────────── */}
            {q && (
               <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">
                     Поиск: <strong className="text-gray-800">«{q}»</strong>
                  </span>
                  <button onClick={() => setParam("q", null)} className="text-gray-400 hover:text-amber">
                     <X size={14} />
                  </button>
               </div>
            )}

            {/* ── Product Grid ─────────────────────────────────────────────────── */}
            {isLoading && page === 1 ? (
               <SkeletonGrid />
            ) : allProducts.length > 0 ? (
               <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                     {allProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                     ))}
                  </div>

                  {/* ── Load More ─────────────────────────────────────────────── */}
                  {isFetching && page > 1 && (
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div
                              key={i}
                              className="bg-card-bg rounded-2xl h-64 animate-pulse border border-gray-100"
                           />
                        ))}
                     </div>
                  )}

                  {showLoadMore && (
                     <div className="mt-6 flex justify-center">
                        <button
                           onClick={handleLoadMore}
                           className="px-8 py-2.5 rounded-full border border-amber text-amber font-semibold
text-sm hover:bg-amber hover:text-white transition-colors"
                        >
                           Показать ещё
                        </button>
                     </div>
                  )}

                  {/* ── End of results ────────────────────────────────────────── */}
                  {!hasMore && allProducts.length > 0 && (
                     <p className="text-center text-xs text-gray-400 mt-6">
                        Показано {allProducts.length} из {data?.total} товаров
                     </p>
                  )}
               </>
            ) : !isLoading ? (
               /* ── Empty State ──────────────────────────────────────────────── */
               <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-4">🛒</div>
                  <p className="text-gray-500 text-sm font-medium">Товары не найdены</p>
                  <p className="text-gray-400 text-xs mt-1">Попробуйте изменить фильтры или поисковый запрос</p>
                  <button
                     onClick={() => setSearchParams({})}
                     className="mt-5 px-5 py-2 rounded-full bg-amber text-white text-sm font-semibold"
                  >
                     Сбросить фильтры
                  </button>
               </div>
            ) : null}
         </div>

         {/* ── Category Sheet ───────────────────────────────────────────────────── */}
         <CategorySheet
            isOpen={isSheetOpen}
            activeCategoryId={categoryId ?? null}
            activeSuperCategoryId={superCategoryId ?? null}
            onSelectCategory={handleCategorySelect}
            onSelectSuperCategory={handleSuperCategorySelect}
            onClose={() => setIsSheetOpen(false)}
         />
      </PageWrapper>
   );
}
```
