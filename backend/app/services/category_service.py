from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app import schemas
from app.models import Category


class CategoryService:
    # obtener, leer catedorias

    @staticmethod
    async def get_all(db: AsyncSession):
        result = await db.execute(select(Category).order_by(Category.id))
        return result.scalars().all()

    # borrar una categoria
    async def delete(db: AsyncSession, category_id: int):
        result = await db.execute(select(Category).where(Category.id == category_id))
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La categoría que intentas borrar ya no existe.",
            )
        await db.delete(category)
        await db.commit()

    # actualizar categoria
    @staticmethod
    async def update(
        db: AsyncSession, category_id: int, updated_data: schemas.CategoryCreate
    ):
        query = select(Category).where(Category.id == category_id)
        result = await db.execute(query)
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La categoría no encontrada",
            )
        # comporbar si ya existe una categoria con el nuevo nombre
        if updated_data.name.strip() != category.name:
            existing_category = select(Category).where(
                Category.name == updated_data.name.strip(),
                Category.id != category_id,
            )
            result = await db.execute(existing_category)
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe una categoría con este nombre.",
                )

        category.name = updated_data.name
        category.description = updated_data.description

        await db.commit()
        await db.refresh(category)

        return category

    # añadir una categoria
    @staticmethod
    async def create(db: AsyncSession, new_data: schemas.CategoryCreate):
        # Comprobar existencia de forma asíncrona
        query = select(Category).where(Category.name == new_data.name)
        result = await db.execute(query)
        existing_category = result.scalar_one_or_none()

        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una categoría con ese nombre",
            )

        category_model = Category(
            name=new_data.name,
            description=new_data.description,
        )

        db.add(category_model)
        await db.commit()
        await db.refresh(category_model)

        return category_model
