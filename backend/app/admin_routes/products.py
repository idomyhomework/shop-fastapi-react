from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app import schemas
from app.database import get_db
import os
from app.services.product_service import ProductService
from starlette.concurrency import run_in_threadpool

router = APIRouter(
    prefix="/products",
    tags=["products"],  # Para organizar en Swagger
)


# ------ ENDPOINTS PARA LOS PRODUCTOS ------
# LEER LOS PRODUCTOS
@router.get("", response_model=schemas.ProductListResponse)
async def get_products(
    q: Optional[str] = Query(default=None, description="Buscar en nombre del producto"),
    bar_code: Optional[str] = Query(
        default=None, description="Código de barras exacto"
    ),
    is_active: Optional[bool] = Query(
        default=None, description="Filtrar por estado activo/inactivo (null = todos)"
    ),
    stock: Optional[int] = Query(default=None, ge=0, description="Stock exacto"),
    price: Optional[float] = Query(default=None, ge=0, description="Precio exacto"),
    category_id: Optional[int] = Query(
        default=None, ge=1, description="Filtrar por categoría"
    ),
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(
        default=25, ge=1, le=100, description="Productos por página"
    ),
    has_discount: Optional[bool] = Query(
        default=None, description="Filtrar por productos descontados (null = todos)"
    ),
    db: AsyncSession = Depends(get_db),
):

    return await ProductService.get_products(
        db=db,
        page=page,
        page_size=page_size,
        q=q,
        bar_code=bar_code,
        is_active=is_active,
        stock=stock,
        price=price,
        category_id=category_id,
        has_discount=has_discount,
    )


# AÑADIR UN PRODUCTO
@router.post(
    "", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED
)
async def create_product(
    data: schemas.ProductCreate,
    db: AsyncSession = Depends(get_db),
):

    return await ProductService.create(db, data)


# ACTUALIZAR UN PRODUCTO
@router.put("/{product_id}", response_model=schemas.ProductRead)
async def update_product(
    product_id: int,
    updated_product_data: schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    return await ProductService.update(db, product_id, updated_product_data)


# BORRAR UN PRODUCTO
@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    config = get_settings()
    files_to_remove = await ProductService.delete(db, product_id)

    # Borrar archivos físicos
    for url in files_to_remove:
        file_path = os.path.join(config.static_dir, url.lstrip("/static/"))
        if os.path.exists(file_path):
            await run_in_threadpool(os.remove, file_path)

    return {"message": "El producto fue eliminado correctamente"}


# ------ ENDPOINT PARA ACTIVAR/DESACTIVAR UN PRODUCTO ------
@router.patch("/{product_id}/toggle-active")
async def toggle_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await ProductService.toggle_active(db, product_id)
    return {"id": product.id, "is_active": product.is_active}
