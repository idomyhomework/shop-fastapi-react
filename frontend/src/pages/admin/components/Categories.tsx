// ── Categories Admin Page ─────────────────────────────────────────────────────
import { useCategories } from "./hooks/useCategories";
import { CategoryModal } from "./miniComponents/CategoryModal";
import type { Category } from "../types/category";

// ── Type tag helper ───────────────────────────────────────────────────────────
function CategoryTypeTag({ category }: { category: Category }) {
   if (category.is_super)
      return (
         <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
            Super
         </span>
      );
   if (category.parent_id !== null)
      return (
         <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Sub
         </span>
      );
   return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
         Independiente
      </span>
   );
}

// ── Categories ────────────────────────────────────────────────────────────────
export function Categories() {
   const { categories, isLoading, loadError, modalOpen, editingCategory, openCreate, openEdit, closeModal, handleDelete, refresh } =
      useCategories();

   // ── Super categories for parent dropdown ──────────────────────────────────
   const superCategories = categories.filter((c) => c.is_super);

   // ── Loading / error states ────────────────────────────────────────────────
   if (isLoading)
      return <div className="flex items-center justify-center h-48 text-gray-400">Cargando categorías...</div>;

   if (loadError)
      return <div className="p-4 text-red-500 bg-red-50 rounded-lg">{loadError}</div>;

   return (
      <div className="p-6">
         {/* ── Header ──────────────────────────────────────────────────────── */}
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Categorías</h2>
            <button
               onClick={openCreate}
               className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
               + Nueva categoría
            </button>
         </div>

         {/* ── Table ───────────────────────────────────────────────────────── */}
         <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
               <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  <tr>
                     <th className="px-4 py-3">ID</th>
                     <th className="px-4 py-3">Nombre</th>
                     <th className="px-4 py-3">Tipo</th>
                     <th className="px-4 py-3">Padre</th>
                     <th className="px-4 py-3">Orden</th>
                     <th className="px-4 py-3">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {categories.map((category) => {
                     // ── Parent name lookup ─────────────────────────────────
                     const parentName = category.parent_id
                        ? categories.find((c) => c.id === category.parent_id)?.name ?? "—"
                        : "—";

                     return (
                        <tr key={category.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                           <td className="px-4 py-3 text-gray-400">{category.id}</td>
                           <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{category.name}</td>
                           <td className="px-4 py-3">
                              <CategoryTypeTag category={category} />
                           </td>
                           <td className="px-4 py-3 text-gray-500">{parentName}</td>
                           <td className="px-4 py-3 text-gray-500">{category.sort_order}</td>
                           <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                 <button
                                    onClick={() => openEdit(category)}
                                    className="text-violet-600 hover:text-violet-800 text-xs font-medium"
                                 >
                                    Editar
                                 </button>
                                 <button
                                    onClick={() => handleDelete(category.id, category.name)}
                                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                                 >
                                    Borrar
                                 </button>
                              </div>
                           </td>
                        </tr>
                     );
                  })}
                  {categories.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                           No hay categorías todavía
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* ── Modal ───────────────────────────────────────────────────────── */}
         <CategoryModal
            isOpen={modalOpen}
            onClose={closeModal}
            onSuccess={refresh}
            categoryToEdit={editingCategory}
            superCategories={superCategories}
         />
      </div>
   );
}
