from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app import schemas
from app.models import Category


# ── Category Service ───────────────────────────────────────────────────────
class CategoryService:
    # ── Read categories (flat list) ────────────────────────────────────────────────
    @staticmethod
    async def get_all(db: AsyncSession):
        result = await db.execute(
            select(Category).order_by(Category.sort_order, Category.id)
        )
        return result.scalars().all()

    # ── Get category tree (super cats + children) ──────────────────────────
    @staticmethod
    async def get_category_tree(db: AsyncSession) -> list[Category]:
        result = await db.execute(
            select(Category)
            .options(selectinload(Category.children))
            .where(Category.is_super == True)
            .order_by(Category.sort_order, Category.id)
        )

        return result.scalars().all()

    # ── Create ─────────────────────────────────────────────────────────────
    @staticmethod
    async def create(db: AsyncSession, new_data: schemas.CategoryCreate) -> Category:
        query = select(Category).where(Category.name == new_data.name)
        result = await db.execute(query)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una categoría con ese nombre",
            )

        # Service-layer constraint: parent must be is_super=True
        if new_data.parent_id is not None:
            parent_result = await db.execute(
                select(Category).where(Category.id == new_data.parent_id)
            )
            parent = parent_result.scalar_one_or_none()
            if not parent:
                raise HTTPException(
                    status_code=404, detail="Categoría padre no encontrada"
                )
            if not parent.is_super:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El padre debe ser una super categoría",
                )

        category = Category(
            name=new_data.name,
            description=new_data.description,
            is_super=new_data.is_super,
            parent_id=new_data.parent_id,
            background_color=new_data.background_color,
            sort_order=new_data.sort_order,
        )
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category

    # ── Update ─────────────────────────────────────────────────────────────
    @staticmethod
    async def update(
        db: AsyncSession, category_id: int, updated_data: schemas.CategoryCreate
    ) -> Category:
        result = await db.execute(select(Category).where(Category.id == category_id))
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada"
            )

        if updated_data.name.strip() != category.name:
            dup = await db.execute(
                select(Category).where(
                    Category.name == updated_data.name.strip(),
                    Category.id != category_id,
                )
            )
            if dup.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe una categoría con este nombre.",
                )

        if updated_data.parent_id is not None:
            parent_result = await db.execute(
                select(Category).where(Category.id == updated_data.parent_id)
            )
            parent = parent_result.scalar_one_or_none()
            if not parent or not parent.is_super:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El padre debe ser una super categoría",
                )

        category.name = updated_data.name
        category.description = updated_data.description
        category.is_super = updated_data.is_super
        category.parent_id = updated_data.parent_id
        category.background_color = updated_data.background_color
        category.sort_order = updated_data.sort_order

        await db.commit()
        await db.refresh(category)
        return category

    # ── Delete ─────────────────────────────────────────────────────────────
    @staticmethod
    async def delete(db: AsyncSession, category_id: int) -> None:
        result = await db.execute(select(Category).where(Category.id == category_id))
        category = result.scalar_one_or_none()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La categoría que intentas borrar ya no existe.",
            )
        await db.delete(category)
        await db.commit()
