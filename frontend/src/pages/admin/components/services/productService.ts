import type { Product, ProductCreate, ProductListResponse } from "../../types/product";
import type { Category } from "../../types/category";


const BASE_URL = "http://127.0.0.1:8000";

export const productServices = {
    async fetchProducts(params: URLSearchParams): Promise<ProductListResponse> {
        const response = await fetch(`${BASE_URL}/products/${params.toString()}`);
        if(!response.ok) throw new Error("Error al cargar los productos");
        return await response.json();
    },

    async fetchCategories(): Promise<Category[]> {
        const response = await fetch(`${BASE_URL}/categories`);
        if(!response.ok) throw new Error("Error al cargar las categorias");
        return await response.json();
    },

    async createProduct(product:ProductCreate): Promise<Product>{
         const response = await fetch(`${BASE_URL}/products`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(product),
      });
      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || "Error al crear producto");
      }
      return await response.json();   
    },

    async deleteProduct(id: number):Promise<null>{
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al eliminar el producto");
      }
      return await response.json();
    },

    async editProduct(product: ProductCreate, id:number): Promise<Product>{
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
        });
        if(!response.ok) throw new Error("Error al actualizar el producto");
        return await response.json();

    }   
}