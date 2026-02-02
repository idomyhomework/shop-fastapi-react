import { useState } from "react";
import { useProducts } from "./hooks/useProducts";
import { ProductSearch } from "./mini components/ProductSearch";
import { Product as ProductComponent } from "./mini components/Product";
import { ProductModal } from "./mini components/ProductModal";
import type { Product } from "../types/product";

export function Products() {
   const {
      products,
      categories,
      loading,
      filters,
      setFilters,
      page,
      setPage,
      pages,
      total,
      handleDelete,
      handleToggleActive,
      refresh,
   } = useProducts();

   const [modalOpen, setModalOpen] = useState(false);
   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
   const [showFilters, setShowFilters] = useState<Boolean>(true);

   const openCreate = () => {
      setEditingProduct(null);
      setModalOpen(true);
   };
   const openEdit = (p: Product) => {
      setEditingProduct(p);
      setModalOpen(true);
   };

   return (
      <>
         <div className="w-full max-w-6xl mx-auto py-8 px-4">
            <div>
               <h2 className="text-2xl font-bold text-gray-800 mb-4">Panel de Productos</h2>
               <div className="flex mb-4 justify-between">
                  <button
                     onClick={() => setShowFilters(!showFilters)}
                     className="lg:hidden flex items-center text-xs gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                  >
                     <svg
                        className={`w-5 h-5 transition-transform ${showFilters ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                     </svg>
                     {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                  </button>
                  <button
                     onClick={openCreate}
                     className="bg-violet-600 text-white text-xs px-6 py-2 rounded-lg font-semibold hover:bg-violet-700 transition-colors"
                  >
                     Crear Producto
                  </button>
               </div>
            </div>
            <div className={`rounded-md p-4 mb-4 ${!showFilters ? "hidden lg:block" : "block"}`}>
               <ProductSearch
                  filters={filters}
                  categories={categories}
                  isLoadingCategories={loading && categories.length === 0}
                  total={total}
                  currentCount={products.length}
                  onFilterChange={(patch) => {
                     setPage(1);
                     setFilters((prev) => ({ ...prev, ...patch }));
                  }}
                  onClear={() =>
                     setFilters({ name: "", bar_code: "", stock: "", price: "", active: "all", categoryId: "" })
                  }
               />
            </div>
            <section className="space-y-2">
               {loading && products.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">Cargando productos...</div>
               ) : products.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
                     No se encontraron productos.
                  </div>
               ) : (
                  products.map((product) => (
                     <ProductComponent
                        key={product.id}
                        product={product}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onToggle={handleToggleActive}
                     />
                  ))
               )}
            </section>

            {pages > 1 && (
               <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                     disabled={page === 1}
                     onClick={() => setPage(page - 1)}
                     className="px-4 py-2 border rounded-lg disabled:opacity-30"
                  >
                     Anterior
                  </button>
                  <span className="text-sm font-medium">
                     Página {page} de {pages}
                  </span>
                  <button
                     disabled={page === pages}
                     onClick={() => setPage(page + 1)}
                     className="px-4 py-2 border rounded-lg disabled:opacity-30"
                  >
                     Siguiente
                  </button>
               </div>
            )}

            <ProductModal
               isOpen={modalOpen}
               onClose={() => setModalOpen(false)}
               onSuccess={refresh}
               categories={categories}
               productToEdit={editingProduct}
            />
         </div>
      </>
   );
}
