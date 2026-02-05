from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import models
from app.database import engine
from app.config import get_settings
from app.admin_routes import categories, products, images

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🔍 DATABASE_URL being used: {settings.database_url}")
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

origins = [str(origin).rstrip("/") for origin in settings.allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")

app.include_router(categories.router)
app.include_router(products.router)
app.include_router(images.router)


@app.get("/")
def root():
    return {"message": f"{settings.app_name} is running"}
