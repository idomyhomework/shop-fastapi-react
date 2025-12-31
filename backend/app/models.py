from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

product_categories_table = Table(
    "product-categories",
    Base.metadata,
    Column("product_id", ForeignKey("products.id"), primary_key=True),
    Column("category_id", ForeignKey("categories.id"), primary_key=True),
)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    products = relationship(
        "Product",
        secondary=product_categories_table,
        back_populates="categories",
    )


class Product(Base):
    __tablename__ = "prodcuts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    isActive = Column(Float, nullable=False, default=True)
    bar_code = Column(String(48), unique=True, nullable=False)

    categories = relationship(
        "Category",
        secondary=product_categories_table,
        back_populates="products",
    )
