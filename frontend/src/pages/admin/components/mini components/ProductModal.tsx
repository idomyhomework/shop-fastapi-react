import { useState, useEffect } from "react";
import { productServices } from "../services/productService";
import type { Product, ProductCreate } from "../../types/product";
import type { Category } from "../../types/category";

interface Props {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   categories: Category[];
   productToEdit?: Product | null;
}

export function ProductModal({ isOpen, onClose, onSuccess, categories, productToEdit }: Props) {
   const BASE_URL = "http://127.0.0.1:8000";

   const [formData, setFormData] = useState({
      name: "",
      description: "",
      bar_code: "",
      price: 0,
      stock: 0,
      is_active: true,
      category_ids: [] as number[],
   });

   const [selectedImages, setSelectedImages] = useState<File[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (productToEdit) {
         setFormData({
            name: productToEdit.name,
            description: productToEdit.description || "",
            bar_code: productToEdit.bar_code,
            price: productToEdit.price,
            stock: productToEdit.stock_quantity,
            is_active: productToEdit.is_active,
            category_ids: productToEdit.categories?.map((c) => c.id) || [],
         });
      } else {
         setFormData({
            name: "",
            description: "",
            bar_code: "",
            price: 0,
            stock: 0,
            is_active: true,
            category_ids: [],
         });
      }
      setSelectedImages([]);
      setError(null);
   }, [productToEdit, isOpen]);

   // Funciones para manejo de imágenes
   const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
         const filesArray = Array.from(event.target.files);
         setSelectedImages((prev) => [...prev, ...filesArray]);
      }
      event.target.value = ""; // Reset para permitir subir el mismo archivo
   };

   const removeSelectedImage = (index: number) => {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
   };

   const getImagePreviewUrl = (file: File): string => {
      return URL.createObjectURL(file);
   };

   const handleDeleteExistingImage = async (imageId: number) => {
      if (!productToEdit || !window.confirm("¿Seguro que quieres borrar esta imagen?")) return;
      try {
         await productServices.deleteImage(productToEdit.id, imageId);
         onSuccess(); // Refrescar para ver que la imagen ya no está
      } catch (err: any) {
         alert(err.message);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
         let productId = productToEdit?.id;

         if (productToEdit) {
            await productServices.editProduct({ ...formData, stock_quantity: formData.stock }, productToEdit.id);
         } else {
            const created = await productServices.createProduct({ ...formData, stock_quantity: formData.stock });
            productId = created.id;
         }

         // Subida de imágenes nuevas
         if (selectedImages.length > 0 && productId) {
            for (let i = 0; i < selectedImages.length; i++) {
               // Si es edición, verificamos si ya hay una principal. Si es creación, la primera es principal.
               const hasMain = productToEdit?.images.some((img) => img.is_main);
               const isMain = !hasMain && i === 0;
               await productServices.uploadImage(productId, selectedImages[i], isMain);
            }
         }

         onSuccess();
         onClose();
      } catch (err: any) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm">
         <div className="relative p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
               {/* Header */}
               <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                     {productToEdit ? "Editar Producto" : "Crear Nuevo Producto"}
                  </h3>
                  <button
                     type="button"
                     onClick={onClose}
                     className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                           fillRule="evenodd"
                           d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                           clipRule="evenodd"
                        />
                     </svg>
                  </button>
               </div>

               {/* Formulario */}
               <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                     <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre *</label>
                     <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                     />
                  </div>

                  <div className="flex flex-col">
                     <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Código de barras *
                     </label>
                     <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.bar_code}
                        onChange={(e) => setFormData({ ...formData, bar_code: e.target.value })}
                        required
                     />
                  </div>

                  <div className="flex flex-col md:col-span-2">
                     <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Descripción</label>
                     <textarea
                        rows={3}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     />
                  </div>

                  <div className="flex flex-col">
                     <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Stock</label>
                     <input
                        type="number"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                     />
                  </div>

                  <div className="flex flex-col">
                     <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Precio *</label>
                     <input
                        type="number"
                        step="0.01"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        required
                     />
                  </div>

                  <div className="flex flex-col md:col-span-2">
                     <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Categorías *
                     </label>
                     <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700">
                        {categories.map((category) => (
                           <div key={category.id} className="flex items-center mb-2 last:mb-0">
                              <input
                                 type="checkbox"
                                 id={`cat-${category.id}`}
                                 checked={formData.category_ids.includes(category.id)}
                                 className="h-4 w-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                                 onChange={() => {
                                    const ids = formData.category_ids.includes(category.id)
                                       ? formData.category_ids.filter((id) => id !== category.id)
                                       : [...formData.category_ids, category.id];
                                    setFormData({ ...formData, category_ids: ids });
                                 }}
                              />
                              <label
                                 htmlFor={`cat-${category.id}`}
                                 className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                              >
                                 {category.name}
                              </label>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Imágenes Existentes (Solo en edición) */}
                  {productToEdit && productToEdit.images.length > 0 && (
                     <div className="flex flex-col md:col-span-2">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                           Imágenes actuales
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                           {productToEdit.images.map((img) => (
                              <div key={img.id} className="relative group">
                                 <img
                                    src={`${BASE_URL}${img.image_url}`}
                                    className="w-full h-24 object-cover rounded border"
                                 />
                                 <button
                                    type="button"
                                    onClick={() => handleDeleteExistingImage(img.id)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                    ✕
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Vista previa de nuevas imágenes */}
                  {selectedImages.length > 0 && (
                     <div className="flex flex-col md:col-span-2">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                           Nuevas imágenes
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                           {selectedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                 <img
                                    src={getImagePreviewUrl(image)}
                                    className="w-full h-24 object-cover rounded border"
                                 />
                                 <button
                                    type="button"
                                    onClick={() => removeSelectedImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                 >
                                    ✕
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Input de subida */}
                  <div className="flex flex-col md:col-span-2">
                     <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Subir imágenes
                     </label>
                     <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                           <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">
                              📷 Click para subir
                           </p>
                        </div>
                        <input
                           type="file"
                           multiple
                           accept="image/*"
                           onChange={handleImageSelection}
                           className="hidden"
                        />
                     </label>
                  </div>

                  <div className="flex items-center space-x-3 mb-4">
                     <input
                        type="checkbox"
                        id="active"
                        className="h-5 w-5 rounded border-gray-300 text-primary-600"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                     />
                     <label htmlFor="active" className="text-sm font-medium text-gray-900 dark:text-white">
                        ¿Mostrar en tienda?
                     </label>
                  </div>

                  {error && <p className="md:col-span-2 text-red-500 text-sm">⚠️ {error}</p>}

                  <button
                     type="submit"
                     disabled={loading}
                     className="md:col-span-2 text-white bg-violet-600 hover:bg-violet-700 focus:ring-4 focus:ring-violet-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
                  >
                     {loading ? "Procesando..." : productToEdit ? "Guardar Cambios" : "Crear Producto"}
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
}
