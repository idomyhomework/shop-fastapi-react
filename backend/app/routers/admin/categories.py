import os
from uuid import uuid4
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from starlette.concurrency import run_in_threadpool
from app import schemas
from app.models import Category
from app.database import get_db
from app.config import get_settings
from app.services.category_service import CategoryService

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)


# ── Get all categories ──────────────────────────────────────────────────────
@router.get("", response_model=List[schemas.Category])
async def get_categories(db: AsyncSession = Depends(get_db)):
    return await CategoryService.get_all(db)


# ── Create category ─────────────────────────────────────────────────────────
@router.post("", response_model=schemas.Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    new_category_data: schemas.CategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    return await CategoryService.create(db, new_category_data)


# ── Update category ─────────────────────────────────────────────────────────
@router.put("/{category_id}", response_model=schemas.Category)
async def update_category(
    category_id: int,
    updated_category_data: schemas.CategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    return await CategoryService.update(db, category_id, updated_category_data)


# ── Delete category ─────────────────────────────────────────────────────────
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await CategoryService.delete(db, category_id)


# ── Upload category image ───────────────────────────────────────────────────
@router.post("/{category_id}/image", response_model=schemas.Category)
async def upload_category_image(
    category_id: int,
    image_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if image_file.content_type not in settings.allowed_image_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extensión no permitida. Usa png, jpeg, webp",
        )
    file_bytes = await image_file.read()
    max_bytes = settings.max_image_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Imagen demasiado grande. Máximo {settings.max_image_size_mb}MB",
        )
    # Delete old image file from disk if one exists
    if category.image_url:
        old_relative = category.image_url.lstrip("/")
        old_path = os.path.join(
            settings.static_dir, old_relative.removeprefix("static/")
        )
        if os.path.exists(old_path):
            await run_in_threadpool(os.remove, old_path)
    file_ext = os.path.splitext(image_file.filename)[1]
    unique_filename = f"{uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.category_images_dir, unique_filename)

    def write_file() -> None:
        with open(file_path, "wb") as f:
            f.write(file_bytes)

    await run_in_threadpool(write_file)
    category.image_url = f"/{settings.category_images_dir}/{unique_filename}"
    await db.commit()
    await db.refresh(category)
    return category


# ── Delete category image ───────────────────────────────────────────────────
@router.delete("/{category_id}/image", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category_image(
    category_id: int,
    db: AsyncSession = Depends(get_db),
):
    settings = get_settings()
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if not category.image_url:
        raise HTTPException(status_code=404, detail="Esta categoría no tiene imagen")
    relative = category.image_url.lstrip("/")
    file_path = os.path.join(settings.static_dir, relative.removeprefix("static/"))
    if os.path.exists(file_path):
        await run_in_threadpool(os.remove, file_path)
    category.image_url = None
    await db.commit()
    return None
