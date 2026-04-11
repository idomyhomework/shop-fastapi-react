// ── Categories Panel ─────────────────────────────────────────────────────────
import { useCategories } from "./hooks/useCategories";
import { CategoryModal } from "./miniComponents/CategoryModal";
import CloseIcon from "./img/close.svg";

// ── Categories ───────────────────────────────────────────────────────────────
export const Categories = () => {
   const {
      categories,
      isLoading,
      loadError,
      modalOpen,
      editingCategory,
      openCreate,
      openEdit,
      closeModal,
      handleDelete,
      refresh,
   } = useCategories();

   return (
      <div className="w-full max-w-6xl mx-auto py-8 px-4">
         {/* Header */}
         <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Panel de Categorías</h3>
            <button
               onClick={openCreate}
               className="bg-violet-600 text-white text-xs px-6 py-2 rounded-lg font-semibold hover:bg-violet-700 transition-colors"
            >
               Nueva categoría
            </button>
         </div>

         {/* Listado */}
         {isLoading ? (
            <p className="text-gray-400 animate-pulse">Cargando categorías...</p>
         ) : loadError ? (
            <p className="text-red-400">{loadError}</p>
         ) : categories.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed text-gray-500">
               No hay categorías todavía. Crea la primera.
            </div>
         ) : (
            <div className="space-y-3">
               {categories.map((category) => (
                  <div
                     key={category.id}
                     className="flex items-center justify-between border border-violet-200 rounded-lg p-4"
                  >
                     <div>
                        <p className="font-semibold text-gray-800">{category.name}</p>
                        {category.description && <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>}
                     </div>

                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => openEdit(category)}
                           className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded transition-colors"
                        >
                           Editar
                        </button>
                        <button
                           onClick={() => handleDelete(category.id, category.name)}
                           className="btn-delete"
                           title="Eliminar categoría"
                        >
                           <img className="w-4 h-4" src={CloseIcon} alt="Eliminar" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* Modal único para crear y editar */}
         <CategoryModal isOpen={modalOpen} onClose={closeModal} onSuccess={refresh} categoryToEdit={editingCategory} />
      </div>
   );
};
