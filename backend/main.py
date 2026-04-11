from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth
from app.core.dependencies import require_admin
from app.database import engine
from app.config import get_settings
from app.routers.admin import categories, products, images
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.scheduler import deactivate_expired_discounts


# ── Settings ───────────────────────────────────────────────────────────────

settings = get_settings()


# ── Scheduler ─────────────────────────────────────────────────────────────

scheduler = AsyncIOScheduler()


# ── Lifespan ───────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(deactivate_expired_discounts, "interval", hours=1)
    scheduler.start()
    yield
    scheduler.shutdown()
    await engine.dispose()


# ── App ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────────────

origins = [str(origin).rstrip("/") for origin in settings.allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Static Files ───────────────────────────────────────────────────────────

app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")


# ── Routers ────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(categories.router, dependencies=[Depends(require_admin)])
app.include_router(products.router, dependencies=[Depends(require_admin)])
app.include_router(images.router, dependencies=[Depends(require_admin)])


# ── Health Check ───────────────────────────────────────────────────────────


@app.get("/")
def root():
    return {"message": f"{settings.app_name} is running"}
