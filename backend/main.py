from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# from app import models  <-- You can remove this import if not used elsewhere
from app.database import engine
from app.config import get_settings
from app.admin_routes import categories, products, images
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.scheduler import deactivate_expired_discounts

settings = get_settings()


scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(deactivate_expired_discounts, "interval", hours=1)
    scheduler.start()
    yield
    scheduler.shutdown()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# Clean up origins (ensuring no trailing slashes for CORS matching)
origins = [str(origin).rstrip("/") for origin in settings.allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files serving
app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")

# Routers
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(images.router)


@app.get("/")
def root():
    return {"message": f"{settings.app_name} is running"}
