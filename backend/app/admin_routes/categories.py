from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.category_service import CategoryService
from app import schemas
from app.database import get_db

router = APIRouter(
    prefix="/categories",
    tags=["categories"],  # Para organizar en Swagger
)

# ------ ENDPOINTS PARA LAS CATEGORÍAS ------


# LEER LAS CATEGORIAS
@router.get("", response_model=List[schemas.Category])
async def get_categories(db: AsyncSession = Depends(get_db)):

    return await CategoryService.get_all(db)


# AÑADIR UNA CATEGORIA
@router.post("", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    new_category_data: schemas.CategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    return await CategoryService.create(db, new_category_data)


# ACTUALIZAR UNA CATEGORIA
@router.put("/{category_id}", response_model=schemas.Category)
async def update_category(
    category_id: int,
    updated_category_data: schemas.CategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    return await CategoryService.update(db, category_id, updated_category_data)


# BORRAR UNA CATEGORIA
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await CategoryService.delete(db, category_id)
