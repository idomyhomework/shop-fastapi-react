import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Category, CategoryCreate } from "../types/category";

export function AdminPanel() {
   const BASE_URL = "http://127.0.0.1:8000";

   //    consts to get the categories
   const [categories, setCategories] = useState<Category[]>([]);
   const [isLoading, setLoading] = useState<boolean>(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   //    consts to create categories
   const [submitError, setSubmitError] = useState<string | null>(null);
   const [newCategoryName, setNewCategoryName] = useState<string>("");
   const [newCategoryDescription, setNewCategoryDescription] = useState<string>("");
   const [isSubmitting, setSubmitting] = useState<boolean>(false);

   useEffect(() => {
      async function fetchCategories() {
         try {
            const response = await fetch(`${BASE_URL}/categories`);
            if (!response.ok) {
               throw new Error("Error while fetching categories");
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
            setLoading(false);
         }
      }
      fetchCategories();
   }, []);

   async function handleCreateCategory(event: FormEvent) {
      event.preventDefault();
      setSubmitError(null);

      if (!newCategoryName.trim()) {
         setSubmitError("El nombre de la categoria es obligatorio");
         return;
      }

      const categoryToCreate: CategoryCreate = {
         name: newCategoryName.trim(),
         description: newCategoryDescription.trim() || null,
      };

      try {
         setSubmitting(true);

         const response = await fetch(`${BASE_URL}/categories`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(categoryToCreate),
         });

         if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const detail = errorBody?.detail ?? "Error al crear la categoría en el servidor";
            throw new Error(detail);
         }

         const createdCategory: Category = await response.json();
         // Añadir la nueva categoría al estado sin recargar
         setCategories((previousCategories) => [...previousCategories, createdCategory]);
         alert(`Categoría creada: ${createdCategory.name}`);
      } catch (error) {
         if (error instanceof Error) {
            setSubmitError(error.message);
         } else {
            setSubmitError("Error desconocido a crear la categoria");
         }
      } finally {
         setSubmitting(false);
         setNewCategoryName("");
         setNewCategoryDescription("");
      }
   }

   return (
      <>
         <section id="admin" className="py-4">
            <h3>Crear nueva categoria</h3>
            <form onSubmit={handleCreateCategory}>
               <div>
                  <label>
                     Nombre:
                     <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                  </label>
               </div>
               <div>
                  <label>
                     Descripción:
                     <input
                        type="text"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                     />
                  </label>
               </div>
               {submitError && <p className="text-red-500">{submitError}</p>}
               <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear categoria"}
               </button>
            </form>
         </section>
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
      </>
   );
}
