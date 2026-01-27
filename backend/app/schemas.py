from pydantic import BaseModel
from typing import Optional, List


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
    product_has_discount: bool = False
    product_discount_percentage: Optional[float] = None


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
    product_has_discount: Optional[bool] = None
    product_discount_percentage: Optional[float] = None



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