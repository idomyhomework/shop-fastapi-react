from typing import List

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import engine, get_db
from uuid import uuid4

import os

# ------ TODOS LOS CONFIGS ------
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
]

# Crear carpeta static si no existe
STATIC_DIR = "static"
PRODUCT_IMAGES_DIR = os.path.join(STATIC_DIR, "products")
os.makedirs(PRODUCT_IMAGES_DIR, exist_ok=True)

# Montar la carpeta static en /static
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------ ENDPOINT PARA LAS CATEGORÍAS ------
@app.get("/categories", response_model=List[schemas.Category])
def get_categories(database_session: Session = Depends(get_db)):
    categories = database_session.query(models.Category).all()
    return categories


@app.post(
    "/categories", response_model=schemas.Category, status_code=status.HTTP_201_CREATED
)
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


# ------ ENDPOINTS PARA LOS PRODUCTOS ------
@app.get("/products", response_model=List[schemas.ProductRead])
def get_products(database_session: Session = Depends(get_db)):
    products = database_session.query(models.Product).all()
    return products


@app.post(
    "/products", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED
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


# ------ ENPOINT PARA SUBIR LAS IMAGENES DE PRODUCTOS ------
@app.post("/products/{product_id}/images", response_model=schemas.ProductImageRead)
async def upload_product_image(
    product_id: int,
    image_file: UploadFile = File(...),
    is_main: bool = False,
    database_session: Session = Depends(get_db),
):  # comprobar si el producto existe en la base
    product = (
        database_session.query(models.Product)
        .filter(models.Product.id == product_id)
        .first()
    )
    # tirar error si no existe
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado.",
        )
    # comprobar si la imagen tiene una de las extensiones permitidas
    allowed_content_type = {"image/jpeg", "image/png", "image/webp"}

    if image_file.content_type not in allowed_content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La extensión del archivo no esta permitida. Usa png, jpeg, webp",
        )
    # guardar imagen en el disco y sacar la url pública para luego usar las imagenes
    file_extension = os.path.splitext(image_file.filename)[1]
    unique_filename = f"{uuid4().hex}{file_extension}"
    file_path = os.path.join(PRODUCT_IMAGES_DIR, unique_filename)

    file_bytes = await image_file.read()
    with open(file_path, "wb") as file_object:
        file_object.write(file_bytes)

    image_url = f"/static/products/{unique_filename}"
    # solo podemos tener una imagen MAIN
    if is_main:
        database_session.query(models.ProductImage).filter(
            models.ProductImage.product_id == product_id,
            models.ProductImage.is_main == True,
        ).update({"is_main": False})
    # guardamos imagen en la tabla ProductImage
    product_image = models.ProductImage(
        product_id=product_id,
        image_url=image_url,
        is_main=is_main,
    )

    database_session.add(product_image)
    database_session.commit()
    database_session.refresh(product_image)

    return product_image


@app.delete("/products/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_image(image_id: int, database_session: Session = Depends(get_db)):
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

    # Borrar archivo físico del disco
    file_path = f"static{image.image_url.replace('/static', '')}"
    if os.path.exists(file_path):
        os.remove(file_path)

    # Borrar registro de la BD
    database_session.delete(image)
    database_session.commit()

    return None
