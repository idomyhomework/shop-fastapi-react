import asyncio
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app import models


# 1. Source (old SQLite) and target (new Postgres) URLs.
#    Adjust the paths/credentials if needed.
SQLITE_URL = "sqlite+aiosqlite:///./app.db"
POSTGRES_URL = "postgresql+asyncpg://root:root_motherveron@localhost:5432/shop_api"


async def migrate_categories(src: AsyncSession, dst: AsyncSession) -> None:
    result = await src.execute(select(models.Category))
    categories: Sequence[models.Category] = result.scalars().all()

    for cat in categories:
        dst_cat = models.Category(
            id=cat.id,  # preserve IDs
            name=cat.name,
            description=cat.description,
        )
        dst.add(dst_cat)

    await dst.commit()
    print(f"[OK] Migrated {len(categories)} categories")


async def migrate_products(src: AsyncSession, dst: AsyncSession) -> None:
    result = await src.execute(select(models.Product))
    products: Sequence[models.Product] = result.scalars().all()

    for p in products:
        dst_product = models.Product(
            id=p.id,  # preserve IDs
            name=p.name,
            description=p.description,
            price=p.price,
            stock_quantity=p.stock_quantity,
            is_active=p.is_active,
            bar_code=p.bar_code,
            has_discount=p.has_discount,
            discount_percentage=p.discount_percentage,
            discount_end_date=p.discount_end_date,
        )
        dst.add(dst_product)

    await dst.commit()
    print(f"[OK] Migrated {len(products)} products")


async def migrate_product_categories(src: AsyncSession, dst: AsyncSession) -> None:
    # Association table (no ORM class, we use the Table object)
    result = await src.execute(select(models.product_categories_table))
    rows = result.all()

    for row in rows:
        insert_stmt = models.product_categories_table.insert().values(
            product_id=row.product_id,
            category_id=row.category_id,
        )
        await dst.execute(insert_stmt)

    await dst.commit()
    print(f"[OK] Migrated {len(rows)} product-category relations")


async def migrate_images(src: AsyncSession, dst: AsyncSession) -> None:
    result = await src.execute(select(models.ProductImage))
    images: Sequence[models.ProductImage] = result.scalars().all()

    for img in images:
        dst_img = models.ProductImage(
            id=img.id,
            product_id=img.product_id,
            image_url=img.image_url,
            is_main=img.is_main,
        )
        dst.add(dst_img)

    await dst.commit()
    print(f"[OK] Migrated {len(images)} images")


async def main() -> None:
    # 2. Create engines and sessions for source and target
    src_engine = create_async_engine(SQLITE_URL, echo=False)
    dst_engine = create_async_engine(POSTGRES_URL, echo=False)

    SrcSession = async_sessionmaker(bind=src_engine, class_=AsyncSession)
    DstSession = async_sessionmaker(bind=dst_engine, class_=AsyncSession)

    # 3. Ensure target schema exists in Postgres
    async with dst_engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)

    async with SrcSession() as src, DstSession() as dst:
        # IMPORTANT: correct order for FKs
        await migrate_categories(src, dst)
        await migrate_products(src, dst)
        await migrate_product_categories(src, dst)
        await migrate_images(src, dst)

    await src_engine.dispose()
    await dst_engine.dispose()
    print("[DONE] Migration complete.")


if __name__ == "__main__":
    asyncio.run(main())
