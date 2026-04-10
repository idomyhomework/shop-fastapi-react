from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import EmailStr

# ── Category Schemas ───────────────────────────────────────────────────────


class CategoryBase(BaseModel):
    name: str
    description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# ── Product Schemas ────────────────────────────────────────────────────────


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    stock_quantity: int = 0
    is_active: bool = True
    bar_code: str
    has_discount: bool = False
    discount_percentage: Optional[float] = 0.0
    discount_end_date: Optional[datetime] = None

    @field_validator("discount_percentage")
    @classmethod
    def validate_discount(cls, value):
        if value is not None and (value < 0 or value > 100):
            raise ValueError("El descuento tiene que estar entre o y 100")
        return value


class ProductCreate(ProductBase):
    category_ids: List[int]


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    bar_code: Optional[str] = None
    is_active: Optional[bool] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    category_ids: Optional[List[int]] = None
    has_discount: Optional[bool] = None
    discount_percentage: Optional[float] = None
    discount_end_date: Optional[datetime] = None


# ── Nested / Relational Schemas ────────────────────────────────────────────


class CategoryInProduct(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ProductImageRead(BaseModel):
    id: int
    image_url: str
    is_main: bool

    class Config:
        from_attributes = True


# ── Product Read Schemas ───────────────────────────────────────────────────


class ProductRead(ProductBase):
    id: int
    categories: List[CategoryInProduct] = []
    images: List[ProductImageRead] = []

    class Config:
        from_attributes = True


# ── Paginated Response Schemas ─────────────────────────────────────────────


class ProductListResponse(BaseModel):
    items: List[ProductRead]
    total: int
    page: int
    page_size: int
    pages: int


# ── Auth Schemas ───────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserRead(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    role: str
    is_active: bool
    loyalty_points: int

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
