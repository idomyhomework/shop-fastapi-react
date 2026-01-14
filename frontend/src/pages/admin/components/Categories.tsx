import React, { act } from "react";
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

   // consts to edit categories
   const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
   const [editCategoryName, setEditCategoryName] = useState<string>("");
   const [editCategoryDescription, setEditCategoryDescription] = useState<string>("");
   const [isCategoryEditing, setCategoryEditing] = useState<boolean>(false);
   const [editError, setEditError] = useState<string | null>(null);

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
   // start edit category
   function startEditingCategory(category: Category) {
      setEditingCategoryId(category.id);
      setEditCategoryName(category.name);
      setEditCategoryDescription(category.description || "");
      setEditError(null);
   }

   // cancel edit category
   function cancelEditCategory() {
      setEditingCategoryId(null);
      setEditCategoryName("");
      setEditCategoryDescription("");
      setEditError(null);
   }
   async function handleEditCategory(categoryId: number) {
      setSubmitError(null);

      if (!editCategoryName.trim()) {
         setEditError("El nombre de categoria es obligatorio");
         return;
      }

      const categoryToUpdate = {
         name: editCategoryName.trim(),
         description: editCategoryDescription.trim(),
      };

      try {
         setCategoryEditing(true);
         const response = await fetch(`${BASE_URL}/categories/${categoryId}`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(categoryToUpdate),
         });
         if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const detail = errorBody?.detail ?? "Error al actualizar la categoría";
            throw new Error(detail);
         }
         const updatedCategory: Category = await response.json();
         setCategories((prevCategories) =>
            prevCategories.map((cat) => (cat.id === categoryId ? updatedCategory : cat))
         );
         alert(`Categoría actualizada: ${updatedCategory.name}!`);
         cancelEditCategory();
      } catch (error) {
         if (error instanceof Error) {
            setEditError(error.message);
         } else {
            setEditError("Error desconocido al editar la categoria");
         }
      } finally {
         setCategoryEditing(false);
      }
   }
   return (
      <div className="lg:grid lg:grid-cols-2 w-9/12 mx-auto py-8 relative">
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
                     <textarea
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
         {/* Sección: Listar y editar categorías */}
         <section id="list-categories" className="lg:pl-2">
            <h3 className="mb-4">✏️ Editar categorías</h3>
            {isLoading ? (
               <p>Cargando categorías...</p>
            ) : loadError ? (
               <p className="text-red-400">{loadError}</p>
            ) : categories.length === 0 ? (
               <p className="text-teal-300">No hay categorías disponibles. Crea una primero.</p>
            ) : (
               <div className="space-y-4">
                  {categories.map((category) => (
                     <div key={category.id} className="border-b-teal-200 border-b-2 p-4">
                        {/* Modo visualización - always visible */}
                        <div className="transition-all duration-300 ease-in-out">
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-semibold">{category.name}</h4>
                              <button
                                 onClick={() => handleDeleteCategory(category.id, category.name)}
                                 className="btn-category-delete"
                                 title="Eliminar categoría"
                              >
                                 <img className="category-delete-icon" src={CloseIcon} alt="Eliminar" />
                              </button>
                           </div>
                           {category.description && <p className="text-gray-300 mb-2">{category.description}</p>}
                           <button
                              onClick={() => startEditingCategory(category)}
                              className="bg-teal-400 hover:bg-teal-600 text-sm"
                           >
                              ✏️ Editar
                           </button>
                        </div>

                        {/* Modal de edición - renders on top when editing this category */}
                        {editingCategoryId === category.id && (
                           <div
                              id="updateProductModal"
                              aria-hidden="false"
                              className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50"
                           >
                              <div className="relative p-4 w-full max-w-2xl">
                                 <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                                    <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                                       <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                          Editar Categoría
                                       </h3>
                                       <button
                                          type="button"
                                          className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                          data-modal-toggle="updateProductModal"
                                          onClick={() => {
                                             setEditingCategoryId(null);
                                          }}
                                       >
                                          <svg
                                             aria-hidden="true"
                                             className="w-5 h-5"
                                             fill="currentColor"
                                             viewBox="0 0 20 20"
                                             xmlns="http://www.w3.org/2000/svg"
                                          >
                                             <path
                                                fill-rule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clip-rule="evenodd"
                                             ></path>
                                          </svg>
                                          <span className="sr-only">Cerrar ventana</span>
                                       </button>
                                    </div>
                                    <form
                                       onSubmit={(e) => {
                                          e.preventDefault();
                                          handleEditCategory(editingCategoryId);
                                       }}
                                    >
                                       <div className="grid gap-4 mb-4 sm:grid-cols-2">
                                          <div>
                                             <label
                                                htmlFor="name"
                                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                             >
                                                Nombre
                                             </label>
                                             <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={editCategoryName}
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                placeholder="Ex. Apple iMac 27&ldquo;"
                                                onChange={(e) => {
                                                   setEditCategoryName(e.target.value);
                                                }}
                                             />
                                          </div>
                                          <div>
                                             <label
                                                htmlFor="brand"
                                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                             >
                                                Proveedor/Marca
                                             </label>
                                             <input
                                                type="text"
                                                name="brand"
                                                id="brand"
                                                value="Google"
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                placeholder="Ex. Apple"
                                             />
                                          </div>
                                          <div className="sm:col-span-2">
                                             <label
                                                htmlFor="description"
                                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                             >
                                                Descripción
                                             </label>
                                             <textarea
                                                id="description"
                                                value={editCategoryDescription}
                                                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                placeholder="Write a description..."
                                                onChange={(e) => setEditCategoryDescription(e.target.value)}
                                             ></textarea>
                                          </div>
                                       </div>
                                       {editError}
                                       <div className="flex items-center space-x-4">
                                          <button
                                             type="submit"
                                             className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                                          >
                                             Actualizar
                                          </button>
                                       </div>
                                    </form>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            )}
         </section>
      </div>
   );
};
