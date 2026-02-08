from decimal import Decimal
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    Table,
    Boolean,
    DateTime,
    Identity,
    Numeric,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from app.database import Base


# Many-to-Many association table
product_categories_table = Table(
    "product_categories",
    Base.metadata,
    Column(
        "product_id", ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True
    ),
)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, Identity(always=False), primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Relationships
    products = relationship(
        "Product",
        secondary=product_categories_table,
        back_populates="categories",
    )

    def __repr__(self):
        return f"<​Category(id={self.id}, name={self.name})>"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, Identity(always=False), primary_key=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # ✅ Money stored as Numeric (exact precision)
    price = Column(
        Numeric(precision=10, scale=2), nullable=False, default=Decimal("0.00")
    )

    stock_quantity = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    bar_code = Column(String(48), unique=True, nullable=False, index=True)

    # ✅ Discount fields with proper types
    has_discount = Column(Boolean, default=False, nullable=False, index=True)
    discount_percentage = Column(
        Numeric(precision=5, scale=2), nullable=False, default=Decimal("0.00")
    )
    discount_end_date = Column(DateTime, nullable=True)

    # Relationships
    categories = relationship(
        "Category",
        secondary=product_categories_table,
        back_populates="products",
    )

    images = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    # ✅ Database-level constraints (enforced even outside Python)
    __table_args__ = (
        CheckConstraint("price >= 0", name="check_price_positive"),
        CheckConstraint("stock_quantity >= 0", name="check_stock_non_negative"),
        CheckConstraint(
            "discount_percentage >= 0 AND discount_percentage <= 100",
            name="check_discount_range",
        ),
        CheckConstraint(
            "(has_discount = false) OR (has_discount = true AND discount_percentage > 0)",
            name="check_discount_consistency",
        ),
        # Composite index for common query patterns
        Index("ix_product_active_discount", "is_active", "has_discount"),
    )

    @property
    def current_price(self) -> Decimal:
        """
        Calculate the effective price after discount.
        Centralized business logic to prevent frontend/backend drift.
        """
        if self.has_discount and self.discount_percentage > 0:
            discount_multiplier = (Decimal("100") - self.discount_percentage) / Decimal(
                "100"
            )
            return (self.price * discount_multiplier).quantize(Decimal("0.01"))
        return self.price

    def __repr__(self):
        return f"<​Product(id={self.id}, name={self.name}, price={self.price})>"


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, Identity(always=False), primary_key=True)
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,  # ✅ Index for JOIN performance
    )
    image_url = Column(String(512), nullable=False)  # ✅ Explicit length for URLs
    is_main = Column(Boolean, default=False, nullable=False)

    # Relationship
    product = relationship("Product", back_populates="images")

    __table_args__ = (
        # ✅ Ensure only one main image per product
        Index(
            "ix_product_main_image_unique",
            "product_id",
            unique=True,
            postgresql_where=(Column("is_main") == True),
        ),
    )

    def __repr__(self):
        return f"<​ProductImage(id={self.id}, product_id={self.product_id}, is_main={self.is_main})>"
