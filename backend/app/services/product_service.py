from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app import models, schemas
from app.models import Product
from app.models import Category


class ProductService:

    # leer, obtener los productos
    @staticmethod
    async def get_products(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 25,
        q: Optional[str] = None,
        bar_code: Optional[str] = None,
        is_active: Optional[bool] = None,
        stock: Optional[int] = None,
        price: Optional[float] = None,
        category_id: Optional[int] = None,
        has_discount: Optional[bool] = None,
    ) -> schemas.ProductListResponse:

        query = select(Product)

        if q:
            query = query.where(Product.name.ilike(f"%{q}%"))

        if bar_code:
            query = query.where(Product.bar_code == bar_code)

        if is_active is not None:
            query = query.where(Product.is_active == is_active)

        if stock is not None:
            query = query.where(Product.stock_quantity == stock)

        if price is not None:
            query = query.where(Product.price == price)

        if has_discount is not None:
            query = query.where(Product.has_discount == has_discount)

        if category_id is not None:
            query = query.join(Product.categories).where(Category.id == category_id)

        # Total y paginación
        # Contar total (Optimizado con subquery)
        count_query = select(func.count()).select_from(query.subquery())
        total_result = (await db.execute(count_query)).scalar_one()
        # Paginación y carga de relaciones
        query = (
            query.options(
                selectinload(Product.categories),
                selectinload(Product.images),
            )
            .order_by(Product.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await db.execute(query)
        items = result.scalars().all()

        pages = (total_result + page_size - 1) // page_size

        return {
            "items": items,
            "total": total_result,
            "page": page,
            "page_size": page_size,
            "pages": pages,
        }

    # añadir nuevo producto
    @staticmethod
    async def create(db: AsyncSession, data: schemas.ProductCreate):
        # Comprobar si ya existe un codigo de barra con el valor recibido
        query = select(models.Product).where(models.Product.bar_code == data.bar_code)
        result = await db.execute(query)
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un producto con ese codigo de barra",
            )

        # Comprobar si las categorías que hemos puesto existen

        cat_query = select(models.Category).where(
            models.Category.id.in_(data.category_ids)
        )
        cat_result = await db.execute(cat_query)
        categories_from_db = cat_result.scalars().all()

        if len(categories_from_db) != len(data.category_ids):
            raise HTTPException(
                status_code=400, detail="Una o más categorías no existen"
            )

        product_data = (
            data.model_dump(exclude={"category_ids"})
            if hasattr(data, "model_dump")
            else data.dict(exclude={"category_ids"})
        )

        product_model = models.Product(**product_data)
        product_model.categories = list(categories_from_db)

        # Crear registro en la BD
        db.add(product_model)
        await db.commit()
        await db.refresh(product_model)

        query_full = (
            select(models.Product)
            .options(
                selectinload(models.Product.categories),
                selectinload(models.Product.images),
            )
            .where(models.Product.id == product_model.id)
        )

        result_full = await db.execute(query_full)

        return result_full.scalar_one()

    # actualizar un producto
    @staticmethod
    async def update(db: AsyncSession, id: int, data: schemas.ProductUpdate):
        query = (
            select(models.Product)
            .options(
                selectinload(models.Product.categories),
                selectinload(models.Product.images),
            )
            .where(models.Product.id == id)
        )
        result = await db.execute(query)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        if data.bar_code and product.bar_code != data.bar_code:
            exist_bc_query = select(models.Product).where(
                models.Product.bar_code == data.bar_code
            )
            exist_bc_result = await db.execute(exist_bc_query)
            if exist_bc_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un producto con ese codigo de barra",
                )

        obj_data = (
            data.model_dump(exclude_unset=True)
            if hasattr(data, "model_dump")
            else data.dict(exclude_unset=True)
        )

        # Actualizar categorías si vienen en la petición
        if "category_ids" in obj_data:
            cat_ids = obj_data.pop("category_ids")
            cat_query = select(models.Category).where(models.Category.id.in_(cat_ids))
            cat_result = await db.execute(cat_query)
            categories = cat_result.scalars().all()
            if len(categories) != len(cat_ids):
                raise HTTPException(
                    status_code=400, detail="Una o más categorías no existen"
                )
            product.categories = list(categories)

        # Actualizar resto de campos
        for key, value in obj_data.items():
            setattr(product, key, value)

        await db.commit()
        await db.refresh(product)
        return product

    # borrar un producto
    @staticmethod
    async def delete(db: AsyncSession, id: int) -> List[str]:
        # Cargar producto con imágenes para poder borrar los archivos físicos
        query = (
            select(Product)
            .options(selectinload(Product.images))
            .where(Product.id == id)
        )
        result = await db.execute(query)
        product_to_delete = result.scalar_one_or_none()

        if not product_to_delete:
            raise HTTPException(status_code=404, detail="El producto no existe.")

        image_urls = [img.image_url for img in product_to_delete.images]

        await db.delete(product_to_delete)
        await db.commit()

        return image_urls

    # activar/desactivar productos
    @staticmethod
    async def toggle_active(db: AsyncSession, id: int):
        query = select(Product).where(Product.id == id)
        result = await db.execute(query)
        product = result.scalar_one_or_none()
        if product is None:
            raise HTTPException(status_code=404, detail="Producto no enconrado.")

        product.is_active = not product.is_active
        await db.commit()
        await db.refresh(product)

        return product
