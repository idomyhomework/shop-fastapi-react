from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import engine, get_db

# Crear las tablas en la base de datos (solo para desarrollo)
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
