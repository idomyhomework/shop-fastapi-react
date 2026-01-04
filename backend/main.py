from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models
from app.database import engine
from app.config import ALLOWED_ORIGINS, STATIC_DIR
from app.admin_routes import categories, products, images

# Crear tablas
models.Base.metadata.create_all(bind=engine)

# Crear app
app = FastAPI(title="Shop API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar carpeta static
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Incluir routers
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(images.router)


@app.get("/")
def root():
    return {"message": "Shop API is running"}
