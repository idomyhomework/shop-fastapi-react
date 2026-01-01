import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Category, CategoryCreate } from "../types/category";
import type { ProductCreate, Product } from "../types/product";
import "../admin.css";

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
         <div className="px-4 py-8 bg-gray-950">
            <h1>Panel Administrativo</h1>
         </div>
         <div id="admin" className="lg:grid lg:grid-cols-2 w-9/12 mx-auto py-8">
            <section id="products">
               <h3 className="mb-2">Crear nuevo producto</h3>
               <form>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="name">Nombre:</label>
                     <input type="text" name="name" />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="description">Descripción:</label>
                     <input type="text" name="description" />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="price">Código de barras</label>
                     <input type="text" name="bar_code" />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="stock">Stock</label>
                     <input type="number" name="stock" className="w-24" />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="price">Precio</label>
                     <input type="number" name="price" className="w-24" />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="stock">Categorías</label>
                     {isLoading ? (
                        <p>Cargando categorías...</p>
                     ) : categories.length === 0 ? (
                        <p className="text-teal-300">No hay categorías disponibles. Crea una primero.</p>
                     ) : (
                        <div className="border border-teal-300 rounded-md p-3 max-h-48 overflow-y-auto">
                           {categories.map((category) => (
                              <div key={category.id} className="flex items-center mb-2">
                                 <input type="checkbox" id={`category-${category.id}`} className="h-4 w-4 mr-2" />
                                 <label htmlFor={`category-${category.id}`} className="cursor-pointer">
                                    {category.name}
                                 </label>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="active">Mostrar el producto?</label>
                     <input type="checkbox" name="active" className="h-8 w-8" />
                  </div>
               </form>
            </section>
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
                     {submitError && <p className="text-red-500">{submitError}</p>}
                     <button type="submit" disabled={isSubmitting} className="mb-8">
                        {isSubmitting ? "Creando..." : "Crear categoria"}
                     </button>
                  </form>
               </div>
               <div className="mb-8">
                  <h3>Listado de categorías</h3>
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
               </div>
            </section>
         </div>
      </>
   );
}
