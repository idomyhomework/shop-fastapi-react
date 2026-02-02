import type { ProductFilters } from "../../types/product";
import type { Category } from "../../types/category";

interface Props {
   filters: ProductFilters;
   categories: Category[];
   onFilterChange: (patch: Partial<ProductFilters>) => void;
   onClear: () => void;
   total: number;
   currentCount: number;
   isLoadingCategories: boolean;
}

export function ProductSearch({
   filters,
   categories,
   onFilterChange,
   onClear,
   total,
   currentCount,
   isLoadingCategories,
}: Props) {
   return (
      <>
         <h4 className="text-lg mb-3">🔍 Buscar productos</h4>

         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            {/* Nombre */}
            <div className="flex flex-col">
               <label className="text-sm text-black-300 mb-1">Nombre</label>
               <input
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                  value={filters.name}
                  onChange={(e) => onFilterChange({ name: e.target.value as ProductFilters["name"] })}
                  placeholder="Buscar por nombre..."
               />
            </div>

            {/* Código de barras */}
            <div className="flex flex-col">
               <label className="text-sm text-black-300 mb-1">Código de barras</label>
               <input
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                  value={filters.bar_code}
                  onChange={(e) => onFilterChange({ bar_code: e.target.value as ProductFilters["bar_code"] })}
                  placeholder="Código exacto..."
               />
            </div>

            {/* Stock exacto */}
            <div className="flex flex-col">
               <label className="text-sm text-black-300 mb-1">Stock (exacto)</label>
               <input
                  type="number"
                  min={0}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                  value={filters.stock}
                  onChange={(e) => onFilterChange({ stock: e.target.value as ProductFilters["stock"] })}
                  placeholder="Ej: 0"
               />
            </div>

            {/* Precio exacto */}
            <div className="flex flex-col">
               <label className="text-sm text-black-300 mb-1">Precio (exacto)</label>
               <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                  value={filters.price}
                  onChange={(e) => onFilterChange({ price: e.target.value as ProductFilters["price"] })}
                  placeholder="Ej: 19.99"
               />
            </div>

            {/* Estado */}
            <div className="flex flex-col">
               <label className="text-sm text-black-300 mb-1">Estado</label>
               <select
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                  value={filters.active}
                  onChange={(e) => onFilterChange({ active: e.target.value as ProductFilters["active"] })}
               >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
               </select>
            </div>

            {/* Categoría */}
            <div className="flex flex-col">
               <label className="text-sm text-black-300 mb-1">Categoría</label>
               <select
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                  value={filters.categoryId}
                  onChange={(e) => onFilterChange({ categoryId: e.target.value })}
                  disabled={isLoadingCategories}
               >
                  <option value="">Todas</option>
                  {categories.map((cat) => (
                     <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                     </option>
                  ))}
               </select>
            </div>
         </div>
         <div className="flex w-full items-center justify-between">
            <p className="text-sm text-gray-400">
               Mostrando <span className="text-black-300 font-semibold">{currentCount}</span> de{" "}
               <span className="text-black-300 font-semibold">{total}</span> productos
            </p>

            <button
               type="button"
               className="border border-gray-500 rounded px-3 py-1.5 text-sm"
               onClick={() => {
                  onClear();
               }}
            >
               Limpiar filtros
            </button>
         </div>
      </>
   );
}
