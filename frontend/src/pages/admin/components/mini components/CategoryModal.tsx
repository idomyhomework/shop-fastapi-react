// ── Category Modal ───────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { categoryService } from "../services/categoryService";
import type { Category, CategoryCreate } from "../../types/category";

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   categoryToEdit?: Category | null;
}

// ── Category Modal ────────────────────────────────────────────────────────────
export function CategoryModal({ isOpen, onClose, onSuccess, categoryToEdit }: Props) {
   // ── State ─────────────────────────────────────────────────────────────────
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // ── Populate Form ─────────────────────────────────────────────────────────
   useEffect(() => {
      if (categoryToEdit) {
         setName(categoryToEdit.name);
         setDescription(categoryToEdit.description ?? "");
      } else {
         setName("");
         setDescription("");
      }
      setError(null);
   }, [categoryToEdit, isOpen]);

   // ── Handle Submit ─────────────────────────────────────────────────────────
   async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);

      if (!name.trim()) {
         setError("El nombre es obligatorio");
         return;
      }

      const data: CategoryCreate = {
         name: name.trim(),
         description: description.trim() || null,
      };

      try {
         setLoading(true);
         if (categoryToEdit) {
            await categoryService.edit(categoryToEdit.id, data);
         } else {
            await categoryService.create(data);
         }
         onSuccess();
         onClose();
      } catch (err) {
         setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
         setLoading(false);
      }
   }

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm">
         <div className="relative p-4 w-full max-w-md">
            <div className="relative p-6 bg-white rounded-lg shadow dark:bg-gray-800">
               {/* Header */}
               <div className="flex justify-between items-center pb-4 mb-4 border-b dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                     {categoryToEdit ? "Editar categoría" : "Nueva categoría"}
                  </h3>
                  <button
                     type="button"
                     onClick={onClose}
                     className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white shadow-none"
                  >
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                           fillRule="evenodd"
                           d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                           clipRule="evenodd"
                        />
                     </svg>
                     <span className="sr-only">Cerrar</span>
                  </button>
               </div>

               {/* Form */}
               <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                     <label htmlFor="cat-name" className="text-sm font-medium text-gray-900 dark:text-white">
                        Nombre *
                     </label>
                     <input
                        id="cat-name"
                        type="text"
                        className="w-full max-w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                     />
                  </div>

                  <div className="flex flex-col gap-1">
                     <label htmlFor="cat-description" className="text-sm font-medium text-gray-900 dark:text-white">
                        Descripción
                     </label>
                     <textarea
                        id="cat-description"
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                     />
                  </div>

                  {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg py-2 px-3">⚠️ {error}</p>}

                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {loading ? "Guardando..." : categoryToEdit ? "Guardar cambios" : "Crear categoría"}
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
}
