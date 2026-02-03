from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app import models
from app.database import engine
from app.config import ALLOWED_ORIGINS, STATIC_DIR
from app.admin_routes import categories, products, images


# Ciclo de vida para crear tablas de forma asíncrona
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield


app = FastAPI(title="Shop API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(categories.router)
app.include_router(products.router)
app.include_router(images.router)


@app.get("/")
def root():
    return {"message": "Shop API is running"}
