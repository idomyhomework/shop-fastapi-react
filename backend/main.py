from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import engine, get_db

# Crear las tablas en la base de datos (solo para desarrollo)
# ------ TODOS LOS CONFIGS ------
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
]

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

    # Comprobar si las categorías que hemos puesto son existentes

    categories_from_db = (
        database_session.query(models.Category)
        .filter(models.Category.id.in_(new_product_data.category_ids))
        .all()
    )
    if len(categories_from_db) != len(new_product_data.category_ids):
        # tirar error si hay categorias que no existen en el DB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Una o más categorías no existen",
        )

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
