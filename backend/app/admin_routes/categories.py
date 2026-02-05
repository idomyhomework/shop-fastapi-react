from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app import models, schemas
from app.database import get_db

router = APIRouter(
    prefix="/categories",
    tags=["categories"],  # Para organizar en Swagger
)

# ------ ENDPOINTS PARA LAS CATEGORÍAS ------


# LEER LAS CATEGORIAS
@router.get("", response_model=List[schemas.Category])
async def get_categories(database_session: AsyncSession = Depends(get_db)):
    query = select(models.Category).order_by(models.Category.id)
    result = await database_session.execute(query)
    return result.scalars().all()


# AÑADIR UNA CATEGORIA
@router.post("", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    new_category_data: schemas.CategoryCreate,
    database_session: AsyncSession = Depends(get_db),
):
    # Comprobar existencia de forma asíncrona
    query = select(models.Category).where(
        models.Category.name == new_category_data.name
    )
    result = await database_session.execute(query)
    existing_category = result.scalar_one_or_none()

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una categoría con ese nombre",
        )

    category_model = models.Category(
        name=new_category_data.name,
        description=new_category_data.description,
    )

    database_session.add(category_model)
    await database_session.commit()
    await database_session.refresh(category_model)

    return category_model


# ACTUALIZAR UNA CATEGORIA
@router.put("/{category_id}", response_model=schemas.Category)
async def update_category(
    category_id: int,
    updated_category_data: schemas.CategoryCreate,
    database_session: AsyncSession = Depends(get_db),
):
    query = select(models.Category).where(models.Category.id == category_id)
    result = await database_session.execute(query)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La categoría no encontrada",
        )

    if updated_category_data.name.strip() != category.name:
        existing_category = select(models.Category).where(
            models.Category.name == updated_category_data.name.strip(),
            models.Category.id != category_id,
        )
        result = await database_session.execute(existing_category)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una categoría con este nombre.",
            )

    category.name = updated_category_data.name
    category.description = updated_category_data.description

    await database_session.commit()
    await database_session.refresh(category)

    return category


# BORRAR UNA CATEGORIA
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    database_session: AsyncSession = Depends(get_db),
):
    query = select(models.Category).where(category_id == models.Category.id)
    result = await database_session.execute(query)
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La categoría qeu intentas borrar ya no existe.",
        )
    await database_session.delete(category)
    await database_session.commit()

    return None
