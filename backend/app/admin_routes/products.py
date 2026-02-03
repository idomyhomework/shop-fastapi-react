from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.config import STATIC_DIR
from app import models, schemas
from app.database import get_db
from datetime import datetime
import os

router = APIRouter(
    prefix="/products",
    tags=["products"],  # Para organizar en Swagger
)


# ------ ENDPOINTS PARA LOS PRODUCTOS ------
# LEER LOS PRODUCTOS
@router.get("/{limit}", response_model=schemas.ProductListResponse)
def get_products(
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
    database_session: Session = Depends(get_db),
):
    query = database_session.query(models.Product).options(
        selectinload(models.Product.categories),
        selectinload(models.Product.images),
    )

    if q:
        query = query.filter(func.lower(models.Product.name).contains(q.lower()))

    if bar_code:
        query = query.filter(models.Product.bar_code == bar_code)

    if is_active is not None:
        query = query.filter(models.Product.is_active == is_active)

    if stock is not None:
        query = query.filter(models.Product.stock_quantity == stock)

    if price is not None:
        query = query.filter(models.Product.price == price)

    if has_discount is not None:
        query = query.filter(models.Product.has_discount == has_discount)

    if category_id is not None:
        query = (
            query.join(models.Product.categories)
            .filter(models.Category.id == category_id)
            .distinct()
        )

    # Total y paginación
    total = query.distinct().count()
    pages = (total + page_size - 1) // page_size

    offset = (page - 1) * page_size
    items = (
        query.order_by(models.Product.id.desc()).offset(offset).limit(page_size).all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


# AÑADIR UN PRODUCTO
@router.post(
    "", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED
)
def create_product(
    new_product_data: schemas.ProductCreate,
    database_session: Session = Depends(get_db),
):

    # Comprobar si ya existe un codigo de barra con el valor recibido
    existing_product = (
        database_session.query(models.Product)
        .filter(models.Product.bar_code == new_product_data.bar_code)
        .first()
    )
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un producto con ese codigo de barra",
        )

    # Comprobar si las categorías que hemos puesto existen

    categories_from_db = (
        database_session.query(models.Category)
        .filter(models.Category.id.in_(new_product_data.category_ids))
        .all()
    )
    if len(categories_from_db) != len(new_product_data.category_ids):
        # Tirar error si hay categorias que no existen en el DB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Una o más categorías no existen",
        )
    # Crear registro en la BD
    product_model = models.Product(
        name=new_product_data.name,
        description=new_product_data.description,
        bar_code=new_product_data.bar_code,
        price=new_product_data.price,
        is_active=new_product_data.is_active,
        stock_quantity=new_product_data.stock_quantity,
        has_discount=new_product_data.has_discount,
        discount_percentage=new_product_data.discount_percentage,
        discount_end_date=new_product_data.discount_end_date,
    )

    product_model.categories = categories_from_db

    database_session.add(product_model)
    database_session.commit()
    database_session.refresh(product_model)

    return product_model


# ACTUALIZAR UN PRODUCTO
@router.put("/{product_id}", response_model=schemas.ProductRead)
def update_product(
    product_id: int,
    updated_product_data: schemas.ProductUpdate,
    database_session: Session = Depends(get_db),
):
    product = (
        database_session.query(models.Product)
        .filter(models.Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if (
        updated_product_data.bar_code
        and updated_product_data.bar_code != product.bar_code
    ):
        exists = (
            database_session.query(models.Product)
            .filter(models.Product.bar_code == updated_product_data.bar_code)
            .first()
        )
        if exists:
            raise HTTPException(status_code=400, detail="Código de barras ya en uso")

    obj_data = updated_product_data.dict(exclude_unset=True)
    for key, value in obj_data.items():
        if key == "category_ids":
            categories = (
                database_session.query(models.Category)
                .filter(models.Category.id.in_(value))
                .all()
            )
            if len(categories) != len(value):
                raise HTTPException(
                    status_code=400, detail="Una o más categorías no existen"
                )
            product.categories = categories
        else:
            # enuentra el atributo key en el producto y ponle el valor nuevo
            setattr(product, key, value)

    database_session.commit()
    database_session.refresh(product)
    return product


# BORRAR UN PRODUCTO
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    database_session: Session = Depends(get_db),
):
    product_to_delete = (
        database_session.query(models.Product)
        .filter(models.Product.id == product_id)
        .first()
    )

    if not product_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El producto que estas intentando borrar no existe.",
        )

    for image in product_to_delete.images:
        file_path = os.path.join(STATIC_DIR, image.image_url.lstrip("/static/"))
        if os.path.exists(file_path):
            os.remove(file_path)

    database_session.delete(product_to_delete)
    database_session.commit()

    return {"message": "El prtoducto fue eleminado correctamente"}


# ------ ENDPOINT PARA ACTIVAR/DESACTIVAR UN PRODUCTO ------
@router.patch("/{product_id}/toggle-active")
async def toggle_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    product.is_active = not product.is_active
    db.commit()
    db.refresh(product)

    return {"id": product.id, "is_active": product.is_active}


# ----- ENDPOINT PARA DESACTIVAR LOS DESCUENTOS AUTOMATICAMENTE -----


@router.patch("/check-expired-products")
async def expired_discounts(db: Session = Depends(get_db)):
    now = datetime.now()

    try:
        query = db.query(models.Product).filter(
            models.Product.has_discount == True,
            models.Product.discount_end_date.isnot(None),
            models.Product.discount_end_date <= now,
        )

        count = query.update(
            {models.Product.has_discount: False}, synchronize_session=False
        )

        if count == 0:
            return {
                "status": "success",
                "message": "No hay descuentos expirados para actualizar",
                "count": 0,
            }

        db.commit()

        return {
            "status": "success",
            "message": f"Se han desactivado {count} descuentos expirados",
            "count": count,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
