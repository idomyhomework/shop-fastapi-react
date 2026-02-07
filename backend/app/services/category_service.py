from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app import schemas
from app.models import Category
from app.schemas import CategoryCreate

class CategoryService:
    async def get_category(db: AsyncSession, data: Category):
        categories = await db.execute(select(Category).order_by(Category.id)).scalars().all()
        return categories