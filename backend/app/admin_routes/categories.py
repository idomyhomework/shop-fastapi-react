from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(
    prefix="/categories",
    tags=["categories"],  # Para organizar en Swagger
)

# ------ ENDPOINTS PARA LAS CATEGORÍAS ------


# LEER LAS CATEGORIAS
@router.get("", response_model=List[schemas.Category])
def get_categories(database_session: Session = Depends(get_db)):
    categories = database_session.query(models.Category).all()
    return categories


# AÑADIR UNA CATEGORIA
@router.post("", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
def create_category(
    new_category_data: schemas.CategoryCreate,
    database_session: Session = Depends(get_db),
):
    # Comprobar si ya existe una categoría con ese nombre
    existing_category = (
        database_session.query(models.Category)
        .filter(models.Category.name == new_category_data.name)
        .first()
    )
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una categoría con ese nombre",
        )

    # Crear registro en la BD
    category_model = models.Category(
        name=new_category_data.name,
        description=new_category_data.description,
    )

    database_session.add(category_model)
    database_session.commit()
    database_session.refresh(category_model)

    return category_model


# ACTUALIZAR UNA CATEGORIA
@router.put("/{category_id}", response_model=schemas.Category)
def update_product(
    category_id: int,
    updated_category_data: schemas.CategoryCreate,
    database_session: Session = Depends(get_db),
):
    category = (
        database_session.query(models.Category)
        .filter(models.Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La categoría no encontrada",
        )

    if updated_category_data.name != category.name:
        existing_category = (
            database_session.query(models.Category)
            .filter(
                models.Category.name == updated_category_data.name,
                models.Category.id != category_id,
            )
            .first()
        )
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una categoría con este nombre.",
            )

    category.name = updated_category_data.name
    category.description = updated_category_data.description

    database_session.commit()
    database_session.refresh(category)

    return category


# BORRAR UNA CATEGORIA
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    database_session: Session = Depends(get_db),
):
    category = (
        database_session.query(models.Category)
        .filter(models.Category.id == category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría que quieres borrar no existe en la base.",
        )

    if len(category.products) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede borrar la categoría. Tiene {len(category.products)} producto(s) asociado(s) a la categoria.",
        )

    database_session.delete(category)
    database_session.commit()

    return None
