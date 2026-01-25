from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.config import STATIC_DIR
from app import models, schemas
from app.database import get_db
import os

router = APIRouter(
    prefix="/products",
    tags=["products"],  # Para organizar en Swagger
)


# ------ ENDPOINTS PARA LOS PRODUCTOS ------
# LEER LOS PRODUCTOS
@router.get("", response_model=List[schemas.ProductRead])
def get_products(database_session: Session = Depends(get_db)):
    products = (
        database_session.query(models.Product)
        .options(
            selectinload(models.Product.categories),
            selectinload(models.Product.images),
        )
        .all()
    )
    return products


# AÑADIR UN PRODUCTO
@router.post(
    "", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED
)
def create_product(
    new_product_data: schemas.ProductCreate,
    database_session: Session = Depends(get_db),
):

    # Comprobar si ya existe un codigo de barra con ese nombre
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
        .filter(product_id == models.Product.id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La categoría no encontrada",
        )

    if (
        updated_product_data.bar_code
        and updated_product_data.bar_code != product.bar_code
    ):
        existing_product = (
            database_session.query(models.Product)
            .filter(
                models.Product.bar_code == updated_product_data.bar_code,
                models.Product.id != product_id,
            )
            .first()
        )
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe otro producto con ese código de barras.",
            )
    if updated_product_data.name is not None:
        product.name = updated_product_data.name
    if updated_product_data.description is not None:
        product.description = updated_product_data.description
    if updated_product_data.bar_code is not None:
        product.bar_code = updated_product_data.bar_code
    if updated_product_data.price is not None:
        product.price = updated_product_data.price
    if updated_product_data.stock_quantity is not None:
        product.stock_quantity = updated_product_data.stock_quantity
    if updated_product_data.is_active is not None:
        product.is_active = updated_product_data.is_active

    if updated_product_data.category_ids is not None:
        categories_from_db = (
            database_session.query(models.Category)
            .filter(models.Category.id.in_(updated_product_data.category_ids))
            .all()
        )

        if len(categories_from_db) != len(updated_product_data.category_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="la categoría que estas intentando añádir no existe",
            )

        product.categories = categories_from_db

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
