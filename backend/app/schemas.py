from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int = 0
    is_active: bool = True
    bar_code: str
    has_discount: bool = False
    discount_percentage: Optional[float] = 0.0
    discount_end_date: Optional[datetime] = None


class ProductCreate(ProductBase):
    category_ids: List[int]


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    bar_code: Optional[str] = None
    is_active: Optional[bool] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category_ids: Optional[List[int]] = None
    has_discount: Optional[bool] = None
    discount_percentage: Optional[float] = None
    discount_end_date: Optional[datetime] = None

    @field_validator('discount_percentage')
    @classmethod
    def validate_discount(cls, value):
        if value is not None and (value < 0 or value>100):
            raise ValueError('El descuento tiene que estar entre o y 100')
        return value
    

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


class ProductRead(ProductBase):
    id: int
    categories: List[CategoryInProduct] = []
    images: List[ProductImageRead] = []

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    items: List[ProductRead]
    total: int
    page: int
    page_size: int
    pages: int