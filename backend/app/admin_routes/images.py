import os
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.config import ALLOWED_IMAGE_TYPES, PRODUCT_IMAGES_DIR

router = APIRouter(
    prefix="/products",
    tags=["images"],
)


@router.post("/{product_id}/images", response_model=schemas.ProductImageRead)
async def upload_product_image(
    product_id: int,
    image_file: UploadFile = File(...),
    is_main: bool = False,
    database_session: Session = Depends(get_db),
):
    product = (
        database_session.query(models.Product)
        .filter(models.Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )

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

    if is_main:
        database_session.query(models.ProductImage).filter(
            models.ProductImage.product_id == product_id,
            models.ProductImage.is_main == True,
        ).update({"is_main": False})

    product_image = models.ProductImage(
        product_id=product_id,
        image_url=image_url,
        is_main=is_main,
    )

    database_session.add(product_image)
    database_session.commit()
    database_session.refresh(product_image)

    return product_image


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_image(image_id: int, database_session: Session = Depends(get_db)):
    from app.config import STATIC_DIR

    image = (
        database_session.query(models.ProductImage)
        .filter(models.ProductImage.id == image_id)
        .first()
    )

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagen no encontrada",
        )

    file_path = os.path.join(STATIC_DIR, image.image_url.lstrip("/static/"))
    if os.path.exists(file_path):
        os.remove(file_path)

    database_session.delete(image)
    database_session.commit()

    return None


@router.delete(
    "/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_single_product_image(
    product_id: int, image_id: int, database_session: Session = Depends(get_db)
):
    from app.config import STATIC_DIR

    image = (
        database_session.query(models.ProductImage)
        .filter(
            models.ProductImage.id == image_id,
            models.ProductImage.product_id == product_id,  # Validación adicional
        )
        .first()
    )

    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagen no encontrada",
        )
    
    was_main = bool(image.is_main)

    image_url = image.image_url 
    relative_path = image_url.replace("/static/", "", 1).lstrip("/")
    file_path = os.path.join(STATIC_DIR, relative_path)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    database_session.delete(image)
    database_session.commit()
    if was_main:
        new_main = (
            database_session.query(models.ProductImage)
            .filter(models.ProductImage.product_id == product_id)
            .order_by(models.ProductImage.id.asc())
            .first()
        )
        if new_main:
            new_main.is_main = True
            database_session.commit()

    return None
