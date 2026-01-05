import React from "react";
import { useEffect, useState } from "react";
import type { Category, CategoryCreate } from "../types/category";
import type { FormEvent } from "react";
import CloseIcon from "./img/close.svg";

export const Categories = () => {
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
      // categories request
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

   // request to create new category
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
   // request to delete a category
   async function handleDeleteCategory(catergoryToDeleteId: number, categoryToDeleteName: string) {
      const userConfirmed = window.confirm(`¿Seguro que quieres borrar la categoría "${categoryToDeleteName}"?`);
      if (!userConfirmed) {
         return;
      }
      try {
         setSubmitting(true);
         setSubmitError(null);
         const response = await fetch(`${BASE_URL}/categories/${catergoryToDeleteId}`, {
            method: "DELETE",
         });
         if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const detail = errorBody?.detail ?? "Error al borrar la categoría en el servidor";
            throw new Error(detail);
         }
         setCategories((previousCategories) =>
            previousCategories.filter((categoryItem) => categoryItem.id !== catergoryToDeleteId)
         );
         alert("La categoria fue eliminada correctamente");
      } catch (error) {
         if (error instanceof Error) {
            setSubmitError(error.message);
         } else {
            setSubmitError("Error desconocido al borrar la categoria");
         }
      } finally {
         setSubmitting(false);
      }
   }
   return (
      <div className="lg:grid lg:grid-cols-2 w-9/12 mx-auto py-8">
         {/* seccion de las categorias  */}
         <section id="categories">
            <div className="lg:mb-64">
               <h3 className="mb-2">Crear nueva categoria</h3>
               <form onSubmit={handleCreateCategory}>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="name">Nombre:</label>
                     <input
                        type="text"
                        name="name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                     />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="description">Descripción:</label>
                     <input
                        type="text"
                        name="description"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                     />
                  </div>
                  {submitError && <p className="text-red-400">{submitError}</p>}
                  <button type="submit" disabled={isSubmitting} className="mb-8">
                     {isSubmitting ? "Creando..." : "Crear categoria"}
                  </button>
               </form>
            </div>
         </section>
         <section>
            <h3>✏️ Editar categoria</h3>
            {categories.length === 0 ? (
               <p>No hay categorías todavía</p>
            ) : (
               <ul>
                  {categories.map((categoryItem) => (
                     <li key={categoryItem.id}>
                        <strong>{categoryItem.name}</strong>
                        {categoryItem.description && <> — {categoryItem.description}</>}
                        <button
                           onClick={() => handleDeleteCategory(categoryItem.id, categoryItem.name)}
                           className="btn-category-delete"
                        >
                           <img className="category-delete-icon" src={`${CloseIcon}`} />
                        </button>
                     </li>
                  ))}
               </ul>
            )}
         </section>
      </div>
   );
};
