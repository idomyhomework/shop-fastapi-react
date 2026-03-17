import { API_BASE_URL } from "../../../../config";
import type { Category, CategoryCreate } from "../../types/category";
const BASE_URL = API_BASE_URL;

export const categoryService = {
   async fetch(): Promise<Category[]> {
      const response = await fetch(`${BASE_URL}/categories`);
      if (!response.ok) throw new Error("Error al cargar las categorias");
      return await response.json();
   },

   async create(category: CategoryCreate): Promise<Category> {
      const response = await fetch(`${BASE_URL}/categories`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(category),
      });
      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || "Error al crear la categoria");
      }
      return await response.json();
   },

   async edit(id: number, category: CategoryCreate): Promise<Category> {
      const response = await fetch(`${BASE_URL}/categories/${id}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(category),
      });
      if (!response.ok) throw new Error("Error al actualizar la categoria");
      return await response.json();
   },

   async delete(id: number): Promise<void> {
      const response = await fetch(`${BASE_URL}/categories/${id}`, {
         method: "DELETE",
         headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || "Error al eliminar la categoria");
      }
      return await response.json();
   },
};
