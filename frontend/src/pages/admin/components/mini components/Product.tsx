import type { Product } from "../../types/product";
import CloseIcon from "../img/close.svg";

interface Props {
   product: Product;
   onEdit: (p: Product) => void;
   onDelete: (id: number, name: string) => void;
   onToggle: (id: number) => void;
}

export function Product({ product, onDelete, onEdit, onToggle }: Props) {
   const BASE_URL = "http://127.0.0.1:8000";

   const mainProductImage = product.images.find((image) => image.is_main === true);

   return (
      <div
         key={product.id}
         className="border border-violet-300 rounded-md p-3 mb-2 sm:grid grid-cols-3 sm:items-center lg:grid-cols-4"
      >
         {/* Imagen */}
         <div className="flex justify-between sm:flex-col">
            {mainProductImage ? (
               <img
                  src={`${BASE_URL}${mainProductImage.image_url}`}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded"
               />
            ) : (
               <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded text-xs text-gray-500">
                  Sin imagen
               </div>
            )}
            <div className="sm:hidden">
               <p className="font-bold">{product.name}</p>
               <p className="">{product.bar_code}</p>
            </div>
         </div>
         {/* Nombre y código de barras */}
         <div className="hidden lg:flex flex-col">
            <p className="font-bold">{product.name}</p>
            <p className="">{product.bar_code}</p>
         </div>

         {/* Precio y Stock */}
         <div className="flex justify-between sm:flex-col ">
            <p className="font-bold hidden sm:block lg:hidden">{product.name}</p>
            <p className="">
               <span className="">Precio:</span> ${product.price}
            </p>
            <p className="">
               <span className="">Stock:</span> {product.stock_quantity}
            </p>
         </div>

         {/* Toggle y botones */}

         {/* Toggle activo/inactivo */}
         <div className="flex justify-between md:justify-normal lg:justify-self-end">
            <label className="relative inline-flex items-center cursor-pointer">
               <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={product.is_active}
                  onChange={() => {
                     onToggle(product.id);
                  }}
               />
               <div className="w-11 h-6 bg-gray-600 peer-checked:bg-violet-600 rounded-full transition-colors"></div>
               <div className="absolute left-0 top-1.1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-6"></div>
            </label>

            {/* Botones de acción */}
            <div className="flex  gap-2 h-fit">
               <button
                  onClick={() => onEdit(product)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 md:p-2.5 text-white text-sm rounded transition-colors md:ml-4"
               >
                  Editar
               </button>
               <button
                  onClick={() => onDelete(product.id, product.name)}
                  className="p-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center justify-center md:ml-4"
                  title="Eliminar producto"
               >
                  <img className="w-4 h-4" src={CloseIcon} alt="Delete" />
               </button>
            </div>
         </div>
      </div>
   );
}
