from datetime import datetime, timezone
from sqlalchemy import update
from app.database import AsyncSessionLocal
from app.models import Product


async def deactivate_expired_discounts():
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        stmt = (
            update(Product)
            .where(
                Product.has_discount == True,
                Product.discount_end_date != None,
                Product.discount_end_date < now,
            )
            .values(has_discount=False, discount_percentage=0.0)
        )
        await db.execute(stmt)
        await db.commit()
