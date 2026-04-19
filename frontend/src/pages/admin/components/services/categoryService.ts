// ── Category Service ─────────────────────────────────────────────────────────
import { BASE_URL } from "../../../../config";
import { fetchWithAuth } from "../../../../utils/fetchWithAuth";
import type { Category, CategoryCreate } from "../../types/category";

// ── Category Service ──────────────────────────────────────────────────────────
export const categoryService = {
   // ── Fetch All ─────────────────────────────────────────────────────────────
   async fetch(): Promise<Category[]> {
      const response = await fetchWithAuth(`${BASE_URL}/categories`);
      if (!response.ok) throw new Error("Error al cargar las categorias");
      return await response.json();
   },

   // ── Create ────────────────────────────────────────────────────────────────
   async create(category: CategoryCreate): Promise<Category> {
      const response = await fetchWithAuth(`${BASE_URL}/categories`, {
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

   // ── Edit ──────────────────────────────────────────────────────────────────
   async edit(id: number, category: CategoryCreate): Promise<Category> {
      const response = await fetchWithAuth(`${BASE_URL}/categories/${id}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(category),
      });
      if (!response.ok) throw new Error("Error al actualizar la categoria");
      return await response.json();
   },

   // ── Delete ────────────────────────────────────────────────────────────────
   async delete(id: number): Promise<void> {
      const response = await fetchWithAuth(`${BASE_URL}/categories/${id}`, {
         method: "DELETE",
         headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || "Error al eliminar la categoria");
      }
   },

   // ── Upload Image ──────────────────────────────────────────────────────────
   async uploadImage(id: number, file: File): Promise<Category> {
      const formData = new FormData();
      formData.append("image_file", file);
      const response = await fetchWithAuth(`${BASE_URL}/categories/${id}/image`, {
         method: "POST",
         body: formData,
      });
      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || "Error al subir la imagen");
      }
      return await response.json();
   },

   // ── Delete Image ──────────────────────────────────────────────────────────
   async deleteImage(id: number): Promise<void> {
      const response = await fetchWithAuth(`${BASE_URL}/categories/${id}/image`, {
         method: "DELETE",
      });
      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || "Error al eliminar la imagen");
      }
   },
};
