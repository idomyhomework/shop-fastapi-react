from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import selectinload
from sqlalchemy import func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app import models, schemas
from app.database import get_db
from datetime import datetime
import os
from app.config import Settings

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
    database_session: AsyncSession = Depends(get_db),
):

    query = select(models.Product)

    if q:
        query = query.where(models.Product.name.ilike(f"%{q}%"))

    if bar_code:
        query = query.where(models.Product.bar_code == bar_code)

    if is_active is not None:
        query = query.where(models.Product.is_active == is_active)

    if stock is not None:
        query = query.where(models.Product.stock_quantity == stock)

    if price is not None:
        query = query.where(models.Product.price == price)

    if has_discount is not None:
        query = query.where(models.Product.has_discount == has_discount)

    if category_id is not None:
        query = query.join(models.Product.categories).where(
            models.Category.id == category_id
        )

    # Total y paginación
    # Contar total (Optimizado con subquery)
    count_query = select(func.count()).select_from(query.subquery())
    total_result = (await database_session.execute(count_query)).scalar_one()
    # Paginación y carga de relaciones
    query = (
        query.options(
            selectinload(models.Product.categories),
            selectinload(models.Product.images),
        )
        .order_by(models.Product.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    result = await database_session.execute(query)
    items = result.scalars().all()

    pages = (total_result + page_size - 1) // page_size

    return {
        "items": items,
        "total": total_result,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


# AÑADIR UN PRODUCTO
@router.post(
    "", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED
)
async def create_product(
    new_product_data: schemas.ProductCreate,
    database_session: AsyncSession = Depends(get_db),
):

    # Comprobar si ya existe un codigo de barra con el valor recibido
    query = select(models.Product).where(
        models.Product.bar_code == new_product_data.bar_code
    )
    result = await database_session.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un producto con ese codigo de barra",
        )

    # Comprobar si las categorías que hemos puesto existen

    cat_query = select(models.Category).where(
        models.Category.id.in_(new_product_data.category_ids)
    )
    cat_result = await database_session.execute(cat_query)
    categories_from_db = cat_result.scalars().all()

    if len(categories_from_db) != len(new_product_data.category_ids):
        raise HTTPException(status_code=400, detail="Una o más categorías no existen")

    product_data = (
        new_product_data.model_dump(exclude={"category_ids"})
        if hasattr(new_product_data, "model_dump")
        else new_product_data.dict(exclude={"category_ids"})
    )

    product_model = models.Product(**product_data)
    product_model.categories = list(categories_from_db)

    # Crear registro en la BD
    database_session.add(product_model)
    await database_session.commit()
    await database_session.refresh(product_model)

    query_full = (
        select(models.Product)
        .options(
            selectinload(models.Product.categories), selectinload(models.Product.images)
        )
        .where(models.Product.id == product_model.id)
    )

    result_full = await database_session.execute(query_full)

    return result_full.scalar_one()


# ACTUALIZAR UN PRODUCTO
@router.put("/{product_id}", response_model=schemas.ProductRead)
async def update_product(
    product_id: int,
    updated_product_data: schemas.ProductUpdate,
    database_session: AsyncSession = Depends(get_db),
):
    query = (
        select(models.Product)
        .options(
            selectinload(models.Product.categories), selectinload(models.Product.images)
        )
        .where(models.Product.id == product_id)
    )
    result = await database_session.execute(query)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if (
        updated_product_data.bar_code
        and product.bar_code != updated_product_data.bar_code
    ):
        exist_bc_query = select(models.Product).where(
            models.Product.bar_code == updated_product_data.bar_code
        )
        exist_bc_result = await database_session.execute(exist_bc_query)
        if exist_bc_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un producto con ese codigo de barra",
            )

    obj_data = (
        updated_product_data.model_dump(exclude_unset=True)
        if hasattr(updated_product_data, "model_dump")
        else updated_product_data.dict(exclude_unset=True)
    )

    # Actualizar categorías si vienen en la petición
    if "category_ids" in obj_data:
        cat_ids = obj_data.pop("category_ids")
        cat_query = select(models.Category).where(models.Category.id.in_(cat_ids))
        cat_result = await database_session.execute(cat_query)
        categories = cat_result.scalars().all()
        if len(categories) != len(cat_ids):
            raise HTTPException(
                status_code=400, detail="Una o más categorías no existen"
            )
        product.categories = list(categories)

    # Actualizar resto de campos
    for key, value in obj_data.items():
        setattr(product, key, value)

    await database_session.commit()
    await database_session.refresh(product)
    return product


# BORRAR UN PRODUCTO
@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    database_session: AsyncSession = Depends(get_db),
):
    config = get_settings()
    # Cargar producto con imágenes para poder borrar los archivos físicos
    query = (
        select(models.Product)
        .options(selectinload(models.Product.images))
        .where(models.Product.id == product_id)
    )
    result = await database_session.execute(query)
    product_to_delete = result.scalar_one_or_none()

    if not product_to_delete:
        raise HTTPException(status_code=404, detail="El producto no existe.")

    # Guardar rutas para borrar después de eliminar de la BD
    files_to_remove = []
    for image in product_to_delete.images:
        file_path = os.path.join(config.static_dir, image.image_url.lstrip("/static/"))
        files_to_remove.append(file_path)

    await database_session.delete(product_to_delete)
    await database_session.commit()

    # Borrar archivos físicos
    for file_path in files_to_remove:
        if os.path.exists(file_path):
            os.remove(file_path)

    return {"message": "El producto fue eliminado correctamente"}


# ------ ENDPOINT PARA ACTIVAR/DESACTIVAR UN PRODUCTO ------
@router.patch("/{product_id}/toggle-active")
async def toggle_product(
    product_id: int, database_session: AsyncSession = Depends(get_db)
):
    query = select(models.Product).where(models.Product.id == product_id)
    result = await database_session.execute(query)
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no enconrado.")

    product.is_active = not product.is_active
    await database_session.commit()
    await database_session.refresh(product)

    return {"id": product.id, "is_active": product.is_active}


# ----- ENDPOINT PARA DESACTIVAR LOS DESCUENTOS AUTOMATICAMENTE -----


@router.patch("/check-expired-products")
async def expired_discounts(db: AsyncSession = Depends(get_db)):
    now = datetime.now()

    try:
        # update() para eficiencia
        stmt = (
            update(models.Product)
            .where(
                models.Product.has_discount == True,
                models.Product.discount_end_date.isnot(None),
                models.Product.discount_end_date <= now,
            )
            .values(has_discount=False)
        )

        result = await db.execute(stmt)
        count = (
            result.rowcount
        )  # rowcount funciona en drivers modernos, si falla usar select count antes

        if count == 0:
            return {
                "status": "success",
                "message": "No hay descuentos expirados para actualizar",
                "count": 0,
            }

        await db.commit()

        return {
            "status": "success",
            "message": f"Se han desactivado {count} descuentos expirados",
            "count": count,
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
