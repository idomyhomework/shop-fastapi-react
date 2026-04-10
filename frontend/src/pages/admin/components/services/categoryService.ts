// ── Category Service ─────────────────────────────────────────────────────────
import { BASE_URL } from "../../../../config";
import type { Category, CategoryCreate } from "../../types/category";

// ── Category Service ──────────────────────────────────────────────────────────
export const categoryService = {
   // ── Fetch All ─────────────────────────────────────────────────────────────
   async fetch(): Promise<Category[]> {
      const response = await fetch(`${BASE_URL}/categories`);
      if (!response.ok) throw new Error("Error al cargar las categorias");
      return await response.json();
   },

   // ── Create ────────────────────────────────────────────────────────────────
   async create(category: CategoryCreate): Promise<Category> {
      const response = await fetch(`${BASE_URL}/categories`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(category),
         credentials: "include",
      });
      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || "Error al crear la categoria");
      }
      return await response.json();
   },

   // ── Edit ──────────────────────────────────────────────────────────────────
   async edit(id: number, category: CategoryCreate): Promise<Category> {
      const response = await fetch(`${BASE_URL}/categories/${id}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(category),
         credentials: "include",
      });
      if (!response.ok) throw new Error("Error al actualizar la categoria");
      return await response.json();
   },

   // ── Delete ────────────────────────────────────────────────────────────────
   async delete(id: number): Promise<void> {
      const response = await fetch(`${BASE_URL}/categories/${id}`, {
         method: "DELETE",
         headers: { "Content-Type": "application/json" },
         credentials: "include",
      });

      if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || "Error al eliminar la categoria");
      }
   },
};
