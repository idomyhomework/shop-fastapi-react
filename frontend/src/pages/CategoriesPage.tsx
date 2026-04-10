// ── Categories Page ──────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import type { Category } from "../types/category";
import { BASE_URL } from "../config";

// ── Categories Page ───────────────────────────────────────────────────────────
export function CategoriesPage() {
   // ── State ─────────────────────────────────────────────────────────────────
   const [categories, setCategories] = useState<Category[]>([]);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   // ── Fetch Categories ──────────────────────────────────────────────────────
   useEffect(() => {
      async function fetchCategories() {
         try {
            const response = await fetch(`${BASE_URL}/categories`);
            if (!response.ok) {
               throw new Error("Error al cargar las categorías");
            }
            const categoriesData: Category[] = await response.json();
            setCategories(categoriesData);
         } catch (error) {
            if (error instanceof Error) {
               setLoadError(error.message);
            } else {
               setLoadError("Error desconocido");
            }
         } finally {
            setIsLoading(false);
         }
      }

      fetchCategories();
   }, []);

   if (isLoading) {
      return <p>Cargando categorías...</p>;
   }

   if (loadError) {
      return <p>Error al cargar categorías: {loadError}</p>;
   }

   return (
      <section>
         <h2>Listado de categorías</h2>
         {categories.length === 0 ? (
            <p>No hay categorías todavía</p>
         ) : (
            <ul>
               {categories.map((categoryItem) => (
                  <li key={categoryItem.id}>
                     <strong>{categoryItem.name}</strong>
                     {categoryItem.description && <> — {categoryItem.description}</>}
                  </li>
               ))}
            </ul>
         )}
      </section>
   );
}
