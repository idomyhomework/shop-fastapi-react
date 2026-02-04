import os
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app import models, schemas
from app.database import get_db
from app.config import ALLOWED_IMAGE_TYPES, PRODUCT_IMAGES_DIR

router = APIRouter(
    prefix="/products",
    tags=["images"],
)

# añadir una imagen
@router.post("/{product_id}/images", response_model=schemas.ProductImageRead)
async def upload_product_image(
    product_id: int,
    image_file: UploadFile = File(...),
    is_main: bool = False,
    database_session: AsyncSession = Depends(get_db),
):
    # comprobar si el producto existe
    query = (
        select(models.Product)
        .where(models.Product.id == product_id)
    )
    result = await database_session.execute(query)

    product = result.scalar_one_or_none()

    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    

    if image_file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La extensión del archivo no esta permitida. Usa png, jpeg, webp",
        )

    file_extension = os.path.splitext(image_file.filename)[1]
    unique_filename = f"{uuid4().hex}{file_extension}"
    file_path = os.path.join(PRODUCT_IMAGES_DIR, unique_filename)

    file_bytes = await image_file.read()
    with open(file_path, "wb") as file_object:
        file_object.write(file_bytes)

    image_url = f"/static/products/{unique_filename}"

    # Si es main, quitar main a las otras
    if is_main:
        stmt = (
            update(models.ProductImage)
            .where(models.ProductImage.product_id == product_id)
            .values(is_main=False)
        )
        await database_session.execute(stmt)
    
    product_image = models.ProductImage(
        product_id=product_id,
        image_url=image_url,
        is_main=is_main,
    )

    database_session.add(product_image)
    await database_session.commit()
    await database_session.refresh(product_image)

    return product_image

# borrar imagen
@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_image(image_id: int, database_session: AsyncSession = Depends(get_db)):
    from app.config import STATIC_DIR

    query = (
        select(models.ProductImage)
        .where(models.ProductImage.id == image_id)
    )
    result = await database_session.execute(query)
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    file_path = os.path.join(STATIC_DIR, image.image_url.lstrip("/static/"))
    if os.path.exists(file_path):
        os.remove(file_path)

    await database_session.delete(image)
    await database_session.commit()

    return None


@router.delete(
    "/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_single_product_image(
    product_id: int, image_id: int, database_session: AsyncSession = Depends(get_db)
):
    from app.config import STATIC_DIR

    query = (
        select(models.ProductImage)
        .where(
            models.ProductImage.id == image_id,
            models.ProductImage.product_id == product_id,  # Validación adicional
        )
    )

    result = await database_session.execute(query)
    image = result.scalar_one_or_none()

    if not image:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    
    was_main = bool(image.is_main)

    image_url = image.image_url 
    relative_path = image_url.replace("/static/", "", 1).lstrip("/")
    file_path = os.path.join(STATIC_DIR, relative_path)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    await database_session.delete(image)
    await database_session.commit()

    if was_main:
        query_new_main = (
            select(models.ProductImage)
            .where(models.ProductImage.product_id == product_id)
            .order_by(models.ProductImage.id.asc())
            .limit(1)
        )
        result_new = await database_session.execute(query_new_main)
        query_new_main = result_new.scalar_one_or_none()
        
        if query_new_main:
            query_new_main.is_main = True
            await database_session.commit()

    return None
