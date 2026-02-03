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
      pageSize,
      setPageSize,
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
            {/* --- HEADER --- */}
            <div>
               <h2 className="text-2xl font-bold text-gray-800 mb-4">Panel de Productos</h2>
               <div className="flex mb-4 justify-between items-center">
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
                     className="bg-violet-600 text-white text-xs px-6 py-2 rounded-lg font-semibold hover:bg-violet-700 transition-colors ml-auto lg:ml-0"
                  >
                     Crear Producto
                  </button>
               </div>
            </div>

            {/* --- FILTROS --- */}
            <div
               className={`rounded-md p-4 mb-4 bg-white shadow-sm border border-gray-100 ${!showFilters ? "hidden lg:block" : "block"}`}
            >
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

            {/* --- LISTADO DE PRODUCTOS --- */}
            {/* Usamos opacity para dar feedback de carga sin mover el layout bruscamente */}
            <section
               className={`space-y-2 min-h-[300px] transition-opacity duration-200 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}
            >
               {products.length === 0 && !loading ? (
                  <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed text-gray-500">
                     No se encontraron productos con estos filtros.
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

               {/* Loading Skeleton simple si está cargando y no hay productos previos */}
               {loading && products.length === 0 && (
                  <div className="text-center py-20 text-gray-400 animate-pulse">Cargando inventario...</div>
               )}
            </section>

            {/* --- PAGINACIÓN PROFESIONAL --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 border-t border-gray-200 pt-6">
               {/* 1. Selector de Densidad */}
               <div className="flex items-center gap-2 text-sm text-gray-600 order-2 sm:order-1">
                  <span>Mostrar:</span>
                  <select
                     value={pageSize}
                     onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1); // Resetear a página 1 al cambiar densidad
                     }}
                     className="border border-gray-300 bg-white rounded px-2 py-1 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 cursor-pointer"
                  >
                     <option value={25}>25</option>
                     <option value={50}>50</option>
                     <option value={100}>100</option>
                  </select>
                  <span className="hidden sm:inline">por página</span>
               </div>

               {/* 2. Información de Contexto */}
               <div className="text-sm text-gray-500 order-1 sm:order-2">
                  Total: <span className="font-bold text-gray-800">{total}</span> productos
               </div>

               {/* 3. Botones de Navegación */}
               {pages > 1 && (
                  <div className="flex items-center gap-2 order-3">
                     <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors bg-white"
                     >
                        Anterior
                     </button>

                     <span className="text-sm font-medium px-3 text-gray-700">
                        {page} / {pages}
                     </span>

                     <button
                        disabled={page === pages}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors bg-white"
                     >
                        Siguiente
                     </button>
                  </div>
               )}
            </div>

            {/* --- MODAL --- */}
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
