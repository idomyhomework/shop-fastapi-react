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
    bar_code: Optional[str] = Query(
        default=None, description="Código de barras exacto"
    ),
    stock: Optional[int] = Query(default=None, ge=0, description="Stock exacto"),
    price: Optional[float] = Query(default=None, ge=0, description="Precio exacto"),
    category_id: Optional[int] = Query(
        default=None, ge=1, description="Filtrar por categoría"
    ),
    super_category_id: Optional[int] = Query(
        default=None, ge=1, description="Filtrar por super categoría"
    ),
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(
        default=25, ge=1, le=100, description="Productos por página"
    ),
    has_discount: Optional[bool] = Query(
        default=None, description="Filtrar por productos descontados (null = todos)"
    ),
    sort: Optional[Literal["popular", "price_asc", "price_desc"]] = Query(
        default="popular", description="Ordenar resultados"
    ),
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


# ── Get a specific product publicaly ────────────────────────────────────────
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
