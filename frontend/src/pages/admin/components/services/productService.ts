import type { Product, ProductCreate, ProductListResponse, ProductUpdate } from "../../types/product";
import type { Category } from "../../types/category";

const BASE_URL = "http://127.0.0.1:8000";

export const productServices = {
   async fetchProducts(params: URLSearchParams): Promise<ProductListResponse> {
      const response = await fetch(`${BASE_URL}/products?${params.toString()}`);
      if (!response.ok) throw new Error("Error al cargar los productos");
      return await response.json();
   },

   async fetchCategories(): Promise<Category[]> {
      const response = await fetch(`${BASE_URL}/categories`);
      if (!response.ok) throw new Error("Error al cargar las categorias");
      return await response.json();
   },

   async createProduct(product: ProductCreate): Promise<Product> {
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

   async deleteProduct(id: number): Promise<null> {
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

   async editProduct(product: ProductUpdate, id: number): Promise<Product> {
      const response = await fetch(`${BASE_URL}/products/${id}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error("Error al actualizar el producto");
      return await response.json();
   },

   async uploadImage(productId: number, file: File, isMain: boolean): Promise<void> {
      const formData = new FormData();
      formData.append("image_file", file);
      const response = await fetch(`${BASE_URL}/products/${productId}/images?is_main=${isMain}`, {
         method: "POST",
         body: formData,
      });

      if (!response.ok) {
         const errorBody = await response.json().catch(() => null);
         throw new Error(errorBody?.detail || "Error al subir la imagen");
      }
   },

   async deleteImage(productId: number, imageId: number): Promise<void> {
      const response = await fetch(`${BASE_URL}/products/${productId}/images/${imageId}`, {
         method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar la imagen");
   },

   async toggleActive(id: number): Promise<{ is_active: boolean }> {
      const response = await fetch(`${BASE_URL}/products/${id}/toggle-active`, {
         method: "PATCH",
      });
      if (!response.ok) throw new Error("Error al cambiar el estado del producto");
      return response.json();
   },
};
