from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",  # load from .env in project root
        env_file_encoding="utf-8",
        extra="ignore",  # ignore unknown env vars
    )

    # ----- General -----
    app_name: str = "Shop API"
    app_version: str = "1.0.0"
    environment: str = "local"  # local | staging | production

    # ----- Database -----
    database_url: str = "sqlite+aiosqlite:///./app.db"
    db_echo: bool = False

    # ----- CORS -----
    allowed_origins: list[AnyHttpUrl] = [
        "http://localhost:5173",
    ]

    # ----- Static / Files -----
    static_dir: str = "static"
    product_images_dir: str = "static/products"

    # ----- Images -----
    allowed_image_types: set[str] = {"image/jpeg", "image/png", "image/webp"}
    max_image_size_mb: int = 5

    @field_validator("product_images_dir")
    @classmethod
    def ensure_product_dir(cls, v: str, info) -> str:
        # Ensure directory exists at runtime (like your previous os.makedirs)
        static_path = Path(v)
        static_path.mkdir(parents=True, exist_ok=True)
        return str(static_path)


@lru_cache
def get_settings() -> Settings:
    # Cached singleton – use everywhere in the app
    return Settings()
