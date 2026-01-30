import { useEffect, useState } from "react";
import CloseIcon from "./img/close.svg";
import type { FormEvent, ChangeEvent } from "react";
import type { Category, CategoryCreate } from "../types/category";
import type { ProductCreate, Product, ProductImage } from "../types/product";
import type { ProductFilters } from "../types/product";
import type { ProductListResponse } from "../types/product";

export function Products() {
   const BASE_URL = "http://127.0.0.1:8000";

   //consts to get products
   const [products, setProducts] = useState<Product[]>([]);
   const [productsLoading, setProductsLoding] = useState<boolean>(false);
   const [loadProductsMessage, setLoadProductsMessage] = useState<string>("");

   //consts to delete products
   const [isDeletingProduct, setIsDeletingProduct] = useState<boolean>(false);
   const [deleteProductError, setDeleteProductError] = useState<string>("");

   //    consts to get the categories
   const [categories, setCategories] = useState<Category[]>([]);
   const [isLoading, setLoading] = useState<boolean>(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   //    consts to create products
   const [newProductName, setNewProductName] = useState<string>("");
   const [newProductDescription, setNewProductDescription] = useState<string>("");
   const [newProductBarCode, setNewProductBarCode] = useState<string>("");
   const [newProductPrice, setNewProductPrice] = useState<number>(0);
   const [newProductStock, setNewProductStock] = useState<number>(0);
   const [newProductIsActive, setNewProductIsActive] = useState<boolean>(true);
   const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
   const [productSubmitError, setProductSubmitError] = useState<string | null>(null);
   const [isSubmittingProduct, setSubmittingProduct] = useState<boolean>(false);

   //    consts to post images
   const [selectedImages, setSelectedImages] = useState<File[]>([]);
   const [createdProductId, setCreatedProductId] = useState<number | null>(null);
   const [isUploadingImages, setUploadingImages] = useState<boolean>(false);
   const [imageUploadError, setImageUploadError] = useState<string | null>(null);

   // consts to edit products
   const [editingProductId, setEditingProductId] = useState<number | null>(null);
   const [editingProductName, setEditingProductName] = useState<string>("");
   const [editingProductDescription, setEditingProductDescription] = useState<string | null>();
   const [editingProductStock, setEditingProductStock] = useState<number>();
   const [editingProductCategories, setEditingProductCategories] = useState<number[]>();
   const [editingProdutPrice, setEditingProductPrice] = useState<number>();
   const [editingProductIsActive, setEditingProductActive] = useState<boolean>();
   const [editingProductBarCode, setEditingProductBarCode] = useState<string>();
   const [updateError, setUpdateError] = useState<string | null>();
   const [hasDiscount, setHasDiscount] = useState<boolean>(false);
   const [discountPercantage, setDiscountPercantage] = useState<number | null>();
   const [discountEndTime, setDiscountEndTime] = useState<string | null>();
   const [editingSelectedImages, setEditingSelectedImages] = useState<File[]>([]);

   // consts to make product seacrh
   const [filters, setFilters] = useState<ProductFilters>({
      name: "",
      bar_code: "",
      stock: "",
      price: "",
      active: "all",
      categoryId: "",
   });

   const [page, setPage] = useState(1);
   const [pageSize] = useState(25);
   const [total, setTotal] = useState(0);
   const [pages, setPages] = useState(1);

   const [isCreatingProduct, setIsCreatingProduct] = useState<boolean>(false);

   const [showFilters, setShowFilters] = useState<boolean>(false);
   function startEditingProduct(product: Product) {
      setEditingProductId(product.id);
      setEditingProductName(product.name);
      setEditingProductDescription(product.description || " ");
      setEditingProductStock(product.stock_quantity);
      setEditingProductPrice(product.price);
      setEditingProductActive(product.is_active);
      const categoryIds = product.categories?.map((cat) => cat.id) || [];
      setEditingProductCategories(categoryIds);
      setEditingProductBarCode(product.bar_code);
   }

   function cancelEditing() {
      setEditingProductId(null);
      setEditingProductName("");
      setEditingProductDescription("");
      setEditingProductBarCode("");
      setEditingProductPrice(0);
      setEditingProductStock(0);
      setEditingProductActive(true);
      setEditingProductCategories([]);
      setUpdateError(null);
      setEditingSelectedImages([]);
   }

   // categories request
   async function fetchCategories() {
      try {
         setLoadProductsMessage("Cargando productos...");
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
   async function fetchProducts() {
      try {
         setProductsLoding(true);
         setLoadProductsMessage("Cargando productos...");

         const params = new URLSearchParams();

         if (filters.name.trim()) params.set("q", filters.name.trim());
         if (filters.bar_code.trim()) params.set("bar_code", filters.bar_code.trim());
         if (filters.stock !== "") params.set("stock", filters.stock);
         if (filters.price !== "") params.set("price", filters.price.replace(",", "."));
         if (filters.active !== "all") {
            params.set("is_active", filters.active === "active" ? "true" : "false");
         }
         if (filters.categoryId) params.set("category_id", filters.categoryId);

         params.set("page", String(page));
         params.set("page_size", String(pageSize));

         const response = await fetch(`${BASE_URL}/products?${params.toString()}`);
         if (!response.ok) {
            throw new Error("Error while fetching products");
         }

         const data: ProductListResponse = await response.json();

         setProducts(data.items);
         setTotal(data.total);
         setPages(data.pages);
      } catch (error) {
         if (error instanceof Error) {
            setLoadError(error.message);
         } else {
            setLoadError("Error desconocido");
         }
      } finally {
         setProductsLoding(false);
      }
   }

   useEffect(() => {
      const timer = setTimeout(() => {
         fetchProducts();
      }, 300); // debounce para evitar muchas peticiones mientras escribes

      return () => clearTimeout(timer);
   }, [filters, page]);

   useEffect(() => {
      fetchProducts();
      fetchCategories();
   }, []);
   // requests for product creation
   function handleCategoryToggle(categoryId: number) {
      setSelectedCategoryIds((previousIds) => {
         if (previousIds.includes(categoryId)) {
            return previousIds.filter((id) => id !== categoryId);
         }
         return [...previousIds, categoryId];
      });
   }
   function handleImageSelection(event: ChangeEvent<HTMLInputElement>) {
      if (event.target.files) {
         const filesArray = Array.from(event.target.files);
         setSelectedImages((prev) => [...prev, ...filesArray]);
      }

      event.target.value = "";
   }

   function getImagePreviewUrl(file: File): string {
      return URL.createObjectURL(file);
   }

   async function handleCreateProduct(event: FormEvent) {
      event.preventDefault();
      setProductSubmitError(null);

      // Validations
      if (!newProductName.trim()) {
         setProductSubmitError("El nombre del producto es obligatorio!");
         return;
      }

      if (!newProductBarCode.trim()) {
         setProductSubmitError("El código de barra del producto es obligatorio!");
         return;
      }

      if (newProductPrice < 0) {
         setProductSubmitError("El precio no puede ser menor que cero");
         return;
      }

      if (newProductStock < 0) {
         setProductSubmitError("El valor mínimo del stock es cero");
         return;
      }

      if (selectedCategoryIds.length == 0) {
         setProductSubmitError("El producto debe pertenecer al menos a una categoría");
         return;
      }

      if (selectedImages.length == 0) {
         setProductSubmitError("Elije al menos una imagen");
         return;
      }

      const productToCreate: ProductCreate = {
         name: newProductName.trim(),
         description: newProductDescription.trim(),
         bar_code: newProductBarCode.trim(),
         price: newProductPrice,
         stock_quantity: newProductStock,
         is_active: newProductIsActive,
         category_ids: selectedCategoryIds,
      };

      try {
         setSubmittingProduct(true);
         const response = await fetch(`${BASE_URL}/products`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(productToCreate),
         });

         if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const detail = errorBody?.detail ?? "Error el crear el producto en el servidor";
            throw new Error(detail);
         }

         const createdProduct: Product = await response.json();
         setCreatedProductId(createdProduct.id);

         if (selectedImages.length > 0) {
            await uploadProductImages(createdProduct.id);
         }

         alert(`Producto creado: ${createdProduct.name}!`);
         // Limpiar formulario
         setNewProductName("");
         setNewProductDescription("");
         setNewProductBarCode("");
         setNewProductPrice(0);
         setNewProductStock(0);
         setNewProductIsActive(true);
         setSelectedCategoryIds([]);
         setSelectedImages([]);
         setCreatedProductId(null);
      } catch (error) {
         if (error instanceof Error) {
            setProductSubmitError(error.message);
         } else {
            setProductSubmitError("Error desconocido al crear el producto");
         }
      } finally {
         setSubmittingProduct(false);
         fetchProducts();
      }
   }

   async function uploadProductImages(productId: number) {
      setUploadingImages(true);
      setImageUploadError(null);

      try {
         // Subir cada imagen una por una
         for (let index = 0; index < selectedImages.length; index++) {
            const imageFile = selectedImages[index];
            const formData = new FormData();
            formData.append("image_file", imageFile);

            // La primera imagen será la principal
            const isMain = index === 0;
            formData.append("is_main", isMain.toString());

            const response = await fetch(`${BASE_URL}/products/${productId}/images?is_main=${isMain}`, {
               method: "POST",
               body: formData,
            });

            if (!response.ok) {
               const errorBody = await response.json().catch(() => null);
               const detail = errorBody?.detail ?? `Error al subir imagen ${index + 1}`;
               throw new Error(detail);
            }
         }

         alert(`${selectedImages.length} imagen(es) subida(s) correctamente`);
      } catch (error) {
         if (error instanceof Error) {
            setImageUploadError(error.message);
         } else {
            setImageUploadError("Error desconocido al subir imágenes");
         }
      } finally {
         setUploadingImages(false);
      }
   }

   async function handleDeleteProductImage(productId: number, imageId: number) {
      const userConfirmed = window.confirm("Seguro que quieres borrar la imagen?");
      if (!userConfirmed) {
         return;
      }

      try {
         const response = await fetch(`${BASE_URL}/products/${productId}/images/${imageId}`, {
            method: "DELETE",
         });

         if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const detail = errorBody?.detail ?? "Error al eliminar la imagen";
            throw new Error(detail);
         }

         await fetchProducts();
         alert("La imagen fue eliminada");
      } catch (error) {
         if (error instanceof Error) {
            alert(error.message);
         } else {
            alert("Error desconocido al eliminar la imagen");
         }
      }
   }

   async function handleEditProduct(event: FormEvent, productId: number) {
      event.preventDefault();
      setUpdateError(null);

      // Validaciones
      if (!editingProductName.trim()) {
         setUpdateError("El nombre del producto es obligatorio!");
         return;
      }

      if (!editingProductBarCode?.trim()) {
         setUpdateError("El código de barra del producto es obligatorio!");
         return;
      }

      if ((editingProdutPrice || 0) < 0) {
         setUpdateError("El precio no puede ser menor que cero");
         return;
      }

      if ((editingProductStock || 0) < 0) {
         setUpdateError("El valor mínimo del stock es cero");
         return;
      }

      if (!editingProductCategories || editingProductCategories.length === 0) {
         setUpdateError("El producto debe pertenecer al menos a una categoría");
         return;
      }

      const productToUpdate = {
         name: editingProductName.trim(),
         description: editingProductDescription?.trim() || null,
         bar_code: editingProductBarCode?.trim(),
         price: editingProdutPrice,
         stock_quantity: editingProductStock,
         is_active: editingProductIsActive,
         category_ids: editingProductCategories,
      };

      try {
         setUploadingImages(true);
         const response = await fetch(`${BASE_URL}/products/${productId}`, {
            method: "PUT",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(productToUpdate),
         });

         if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const detail = errorBody?.detail ?? "Error al actualizar el producto";
            throw new Error(detail);
         }

         // Si hay nuevas imágenes, subirlas
         if (editingSelectedImages.length > 0) {
            // Subir cada imagen una por una
            for (let index = 0; index < editingSelectedImages.length; index++) {
               const imageFile = editingSelectedImages[index];
               const formData = new FormData();
               formData.append("image_file", imageFile);

               // Determinar si es la imagen principal (solo si no hay otras imágenes)
               const product = products.find((p) => p.id === productId);
               const hasMainImage = product?.images.some((img) => img.is_main);
               const isMain = !hasMainImage && index === 0;
               formData.append("is_main", isMain.toString());

               const uploadResponse = await fetch(`${BASE_URL}/products/${productId}/images?is_main=${isMain}`, {
                  method: "POST",
                  body: formData,
               });

               if (!uploadResponse.ok) {
                  const errorBody = await uploadResponse.json().catch(() => null);
                  const detail = errorBody?.detail ?? `Error al subir imagen ${index + 1}`;
                  throw new Error(detail);
               }
            }
            setEditingSelectedImages([]);
         }

         await fetchProducts();
         alert("Producto actualizado correctamente");
         cancelEditing();
      } catch (error) {
         if (error instanceof Error) {
            setUpdateError(error.message);
         } else {
            setUpdateError("Error desconocido al actualizar el producto");
         }
      } finally {
         setUploadingImages(false);
      }
   }

   async function handleProductToggle(productId: number) {
      try {
         const response = await fetch(`${BASE_URL}/products/${productId}/toggle-active`, {
            method: "PATCH",
            headers: {
               "Content-Type": "application/json",
            },
         });

         if (!response.ok) {
            throw new Error("No se puede activar/desactivar el producto");
         }

         const data = await response.json();
         setProducts(
            products.map((product) => (product.id === productId ? { ...product, is_active: data.is_active } : product))
         );
      } catch (error) {
         if (error instanceof Error) {
            setUpdateError(error.message);
         } else {
            setUpdateError("Error desconocido al actualizar el producto");
         }
      }
   }

   async function handleDeleteProduct(productToDeleteId: number, productToDeleteName: string) {
      const userConfirmed = window.confirm(`¿Seguro que quieres borrar el producto "${productToDeleteName}"?`);
      if (!userConfirmed) {
         return;
      }
      try {
         setIsDeletingProduct(true);
         const response = await fetch(`${BASE_URL}/products/${productToDeleteId}`, {
            method: "DELETE",
         });
         if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const detail = errorBody?.detail ?? "Error en el servidor al borrar el producto";
            throw new Error(detail);
         }
         setProducts((previousProducts) =>
            previousProducts.filter((productItem) => productItem.id !== productToDeleteId)
         );
         alert("El producto fue eliminado correctamente");
      } catch (error) {
         if (error instanceof Error) {
            setProductSubmitError(error.message);
         } else {
            setProductSubmitError("Error desconocido al borrar el producto");
         }
      } finally {
         setIsDeletingProduct(false);
      }
   }

   function handleClickEditProduct(product: Product) {
      startEditingProduct(product);
      setEditingProductId(product.id);
   }

   function handleEditImageSelection(event: ChangeEvent<HTMLInputElement>) {
      if (event.target.files) {
         const filesArray = Array.from(event.target.files);
         // Añadir las nuevas imágenes a las ya existentes
         setEditingSelectedImages((prev) => [...prev, ...filesArray]);
      }
      // Limpiar el input para permitir seleccionar más archivos
      event.target.value = "";
   }

   function removeEditingSelectedImage(index: number) {
      setEditingSelectedImages((prev) => prev.filter((_, i) => i !== index));
   }

   function removeSelectedImage(index: number) {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
   }

   function handleExitProductCreation() {
      // Limpiar formulario
      setIsCreatingProduct(false);
      setNewProductName("");
      setNewProductDescription("");
      setNewProductBarCode("");
      setNewProductPrice(0);
      setNewProductStock(0);
      setNewProductIsActive(true);
      setSelectedCategoryIds([]);
      setSelectedImages([]);
      setCreatedProductId(null);
   }

   function updateFilters(patch: Partial<ProductFilters>) {
      setPage(1);
      setFilters((prev) => ({ ...prev, ...patch }));
   }
   return (
      <>
         <div id="admin" className="w-9/12 mx-auto py-8">
            {/* Modo creación producto */}
            {isCreatingProduct && (
               <div
                  id="createProductModal"
                  aria-hidden="false"
                  className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
               >
                  <div className="relative p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                     {/* Contenido del Modal */}
                     <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crear Nuevo Producto</h3>
                           <button
                              type="button"
                              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                              onClick={() => handleExitProductCreation()}
                           >
                              <svg
                                 aria-hidden="true"
                                 className="w-5 h-5"
                                 fill="currentColor"
                                 viewBox="0 0 20 20"
                                 xmlns="http://www.w3.org/2000/svg"
                              >
                                 <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                 ></path>
                              </svg>
                              <span className="sr-only">Cerrar ventana</span>
                           </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Nombre */}
                           <div className="flex flex-col">
                              <label
                                 htmlFor="name"
                                 className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                              >
                                 Nombre <span className="text-red-500">*</span>
                              </label>
                              <input
                                 type="text"
                                 name="name"
                                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                 value={newProductName}
                                 onChange={(e) => setNewProductName(e.target.value)}
                                 required
                              />
                           </div>

                           {/* Código de Barras */}
                           <div className="flex flex-col">
                              <label
                                 htmlFor="bar_code"
                                 className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                              >
                                 Código de barras <span className="text-red-500">*</span>
                              </label>
                              <input
                                 type="text"
                                 name="bar_code"
                                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                 value={newProductBarCode}
                                 onChange={(e) => setNewProductBarCode(e.target.value)}
                                 required
                              />
                           </div>

                           {/* Descripción */}
                           <div className="flex flex-col md:col-span-2">
                              <label
                                 htmlFor="description"
                                 className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                              >
                                 Descripción
                              </label>
                              <textarea
                                 name="description"
                                 rows="3"
                                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                 value={newProductDescription}
                                 onChange={(e) => setNewProductDescription(e.target.value)}
                              />
                           </div>

                           {/* Stock */}
                           <div className="flex flex-col">
                              <label
                                 htmlFor="stock"
                                 className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                              >
                                 Stock
                              </label>
                              <input
                                 type="number"
                                 name="stock"
                                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                 value={newProductStock}
                                 onChange={(e) => setNewProductStock(parseInt(e.target.value) || 0)}
                              />
                           </div>

                           {/* Precio */}
                           <div className="flex flex-col">
                              <label
                                 htmlFor="price"
                                 className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                              >
                                 Precio <span className="text-red-500">*</span>
                              </label>
                              <input
                                 type="number"
                                 step="0.01"
                                 name="price"
                                 className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                 value={newProductPrice}
                                 onChange={(event) => {
                                    const valueWithDot = event.target.value.replace(",", ".");
                                    setNewProductPrice(parseFloat(valueWithDot));
                                 }}
                                 required
                              />
                           </div>

                           {/* Categorías */}
                           <div className="flex flex-col md:col-span-2">
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                 Categorías <span className="text-red-500">*</span>
                              </label>
                              {isLoading ? (
                                 <p className="text-gray-400 text-sm">Cargando categorías...</p>
                              ) : categories.length === 0 ? (
                                 <p className="text-teal-500 text-sm font-semibold">
                                    No hay categorías disponibles. Crea una primero.
                                 </p>
                              ) : (
                                 <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700">
                                    {categories.map((category) => (
                                       <div key={category.id} className="flex items-center mb-2 last:mb-0">
                                          <input
                                             type="checkbox"
                                             id={`category-${category.id}`}
                                             checked={selectedCategoryIds.includes(category.id)}
                                             className="h-4 w-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                             onChange={() => handleCategoryToggle(category.id)}
                                          />
                                          <label
                                             htmlFor={`category-${category.id}`}
                                             className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                                          >
                                             {category.name}
                                          </label>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                           {/* Vista previa de imágenes seleccionadas */}
                           {selectedImages.length > 0 && (
                              <div className="flex flex-col md:col-span-2">
                                 <div className="grid lg:grid-cols-3 gap-2 w-full justify-between">
                                    {selectedImages.map((image, index) => (
                                       <div key={index} className="relative group">
                                          <img
                                             src={getImagePreviewUrl(image)}
                                             alt={`Preview ${index + 1}`}
                                             className="w-full h-24 object-cover rounded border border-gray-300"
                                          />
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                             {image.name}
                                          </p>
                                          <button
                                             type="button"
                                             onClick={() => removeSelectedImage(index)}
                                             className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                   fillRule="evenodd"
                                                   d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                   clipRule="evenodd"
                                                />
                                             </svg>
                                          </button>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                           {/* Imágenes */}
                           <div className="flex flex-col md:col-span-2">
                              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                 Imágenes del producto <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center justify-center w-full">
                                 <label
                                    htmlFor="images"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                                 >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                       <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">
                                          📷 Subir imágenes
                                       </p>
                                       <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG o WEBP</p>
                                    </div>
                                    <input
                                       id="images"
                                       type="file"
                                       multiple
                                       accept="image/*"
                                       onChange={handleImageSelection}
                                       className="hidden"
                                    />
                                 </label>
                              </div>
                              {selectedImages.length > 0 && (
                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {selectedImages.length} imágenes seleccionadas. La primera será la principal.
                                 </p>
                              )}
                           </div>

                           {/* Toggle Activo */}
                           <div className="flex items-center space-x-3 mb-4">
                              <input
                                 type="checkbox"
                                 id="active"
                                 className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                 checked={newProductIsActive}
                                 onChange={(e) => setNewProductIsActive(e.target.checked)}
                              />
                              <label htmlFor="active" className="text-sm font-medium text-gray-900 dark:text-white">
                                 ¿Mostrar producto en la tienda?
                              </label>
                           </div>

                           {/* Errores */}
                           <div className="md:col-span-2">
                              {productSubmitError && (
                                 <p className="text-red-500 text-sm mb-1">⚠️ {productSubmitError}</p>
                              )}
                              {imageUploadError && (
                                 <p className="text-orange-500 text-sm mb-1">⚠️ {imageUploadError}</p>
                              )}
                           </div>

                           {/* Botón Submit */}
                           <button
                              type="submit"
                              disabled={isSubmittingProduct || isUploadingImages}
                              className="md:col-span-2 text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
                           >
                              {isSubmittingProduct
                                 ? "Creando..."
                                 : isUploadingImages
                                   ? "Subiendo imágenes..."
                                   : "Crear producto"}
                           </button>
                        </form>
                     </div>
                  </div>
               </div>
            )}
            {/* Botón para mostrar/ocultar filtros y para crear productos en móvil */}
            <div className="flex items-center gap-2 mb-4 lg:hidden text-xs">
               <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
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
               <button className="lg:hidden text-xs" onClick={() => setIsCreatingProduct(true)}>
                  Crear Producto
               </button>
            </div>
            <div className={`rounded-md p-4 mb-4 ${!showFilters ? "hidden lg:block" : "block"}`}>
               <h4 className="text-lg mb-3">🔍 Buscar productos</h4>

               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                  {/* Nombre */}
                  <div className="flex flex-col">
                     <label className="text-sm text-black-300 mb-1">Nombre</label>
                     <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                        value={filters.name}
                        onChange={(e) => updateFilters({ name: e.target.value })}
                        placeholder="Buscar por nombre..."
                     />
                  </div>

                  {/* Código de barras */}
                  <div className="flex flex-col">
                     <label className="text-sm text-black-300 mb-1">Código de barras</label>
                     <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                        value={filters.bar_code}
                        onChange={(e) => updateFilters({ bar_code: e.target.value })}
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
                        onChange={(e) => updateFilters({ stock: e.target.value })}
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
                        onChange={(e) => updateFilters({ price: e.target.value })}
                        placeholder="Ej: 19.99"
                     />
                  </div>

                  {/* Estado */}
                  <div className="flex flex-col">
                     <label className="text-sm text-black-300 mb-1">Estado</label>
                     <select
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                        value={filters.active}
                        onChange={(e) => updateFilters({ active: e.target.value as ProductFilters["active"] })}
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
                        onChange={(e) => updateFilters({ categoryId: e.target.value })}
                        disabled={isLoading}
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

               <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                     Mostrando <span className="text-black-300 font-semibold">{products.length}</span> de{" "}
                     <span className="text-black-300 font-semibold">{total}</span> productos
                  </p>

                  <button
                     type="button"
                     className="border border-gray-500 rounded px-3 py-1.5 text-sm"
                     onClick={() => {
                        setPage(1);
                        setFilters({
                           name: "",
                           bar_code: "",
                           stock: "",
                           price: "",
                           active: "all",
                           categoryId: "",
                        });
                     }}
                  >
                     Limpiar filtros
                  </button>
               </div>
            </div>
            <section>
               <div className="flex justify-between mb-4">
                  <h3 className="">✏️ Editar productos</h3>
                  <button className="hidden lg:block" onClick={() => setIsCreatingProduct(true)}>
                     Crear Producto
                  </button>
               </div>
               {productsLoading ? (
                  <p>{loadProductsMessage}</p>
               ) : products.length === 0 ? (
                  <p className="text-teal-300">No hay productos disponibles. Crea uno primero. </p>
               ) : (
                  <div>
                     {products.map((productItem) => {
                        const mainProductImage = productItem.images.find((image) => image.is_main === true);

                        return (
                           <div
                              key={productItem.id}
                              className="border border-violet-300 rounded-md p-3 mb-2 sm:grid grid-cols-3 sm:items-center lg:grid-cols-4"
                           >
                              {/* Imagen */}
                              <div className="flex justify-between sm:flex-col">
                                 {mainProductImage ? (
                                    <img
                                       src={`${BASE_URL}${mainProductImage.image_url}`}
                                       alt={productItem.name}
                                       className="w-16 h-16 object-cover rounded"
                                    />
                                 ) : (
                                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded text-xs text-gray-500">
                                       Sin imagen
                                    </div>
                                 )}
                                 <div className="sm:hidden">
                                    <p className="font-bold">{productItem.name}</p>
                                    <p className="">{productItem.bar_code}</p>
                                 </div>
                              </div>
                              {/* Nombre y código de barras */}
                              <div className="hidden lg:flex flex-col">
                                 <p className="font-bold">{productItem.name}</p>
                                 <p className="">{productItem.bar_code}</p>
                              </div>

                              {/* Precio y Stock */}
                              <div className="flex justify-between sm:flex-col ">
                                 <p className="font-bold hidden sm:block lg:hidden">{productItem.name}</p>
                                 <p className="">
                                    <span className="">Precio:</span> ${productItem.price}
                                 </p>
                                 <p className="">
                                    <span className="">Stock:</span> {productItem.stock_quantity}
                                 </p>
                              </div>

                              {/* Toggle y botones */}

                              {/* Toggle activo/inactivo */}
                              <div className="flex justify-between md:justify-normal lg:justify-self-end">
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                       type="checkbox"
                                       className="sr-only peer"
                                       checked={productItem.is_active}
                                       onChange={() => {
                                          handleProductToggle(productItem.id);
                                       }}
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-checked:bg-violet-600 rounded-full transition-colors"></div>
                                    <div className="absolute left-0 top-1.1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-6"></div>
                                 </label>

                                 {/* Botones de acción */}
                                 <div className="flex  gap-2 h-fit">
                                    <button
                                       onClick={() => handleClickEditProduct(productItem)}
                                       className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 md:p-2.5 text-white text-sm rounded transition-colors md:ml-4"
                                    >
                                       Editar
                                    </button>
                                    <button
                                       onClick={() => handleDeleteProduct(productItem.id, productItem.name)}
                                       className="p-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center justify-center md:ml-4"
                                       title="Eliminar producto"
                                    >
                                       <img className="w-4 h-4" src={CloseIcon} alt="Delete" />
                                    </button>
                                 </div>
                              </div>

                              {/* Editar productos */}
                              {editingProductId == productItem.id && (
                                 <div
                                    id="createProductModal"
                                    aria-hidden="false"
                                    className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
                                 >
                                    <div className="relative p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                       {/* Contenido del Modal */}
                                       <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                                          {/* Header */}
                                          <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                                             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Editar Producto
                                             </h3>
                                             <button
                                                type="button"
                                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                                onClick={() => setEditingProductId(null)}
                                             >
                                                <svg
                                                   aria-hidden="true"
                                                   className="w-5 h-5"
                                                   fill="currentColor"
                                                   viewBox="0 0 20 20"
                                                   xmlns="http://www.w3.org/2000/svg"
                                                >
                                                   <path
                                                      fillRule="evenodd"
                                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                      clipRule="evenodd"
                                                   ></path>
                                                </svg>
                                                <span className="sr-only">Cerrar ventana</span>
                                             </button>
                                          </div>

                                          {/* Formulario */}
                                          <form
                                             onSubmit={(e) => handleEditProduct(e, editingProductId)}
                                             className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                          >
                                             {/* Nombre */}
                                             <div className="flex flex-col">
                                                <label
                                                   htmlFor="name"
                                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                                >
                                                   Nombre <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                   type="text"
                                                   name="name"
                                                   className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                   value={editingProductName}
                                                   onChange={(e) => setEditingProductName(e.target.value)}
                                                   required
                                                />
                                             </div>

                                             {/* Código de Barras */}
                                             <div className="flex flex-col">
                                                <label
                                                   htmlFor="bar_code"
                                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                                >
                                                   Código de barras <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                   type="text"
                                                   name="bar_code"
                                                   className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                   value={editingProductBarCode}
                                                   onChange={(e) => setEditingProductBarCode(e.target.value)}
                                                   required
                                                />
                                             </div>

                                             {/* Descripción */}
                                             <div className="flex flex-col md:col-span-2">
                                                <label
                                                   htmlFor="description"
                                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                                >
                                                   Descripción
                                                </label>
                                                <textarea
                                                   name="description"
                                                   rows="3"
                                                   className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                   value={
                                                      !editingProductDescription?.trim()
                                                         ? ""
                                                         : editingProductDescription
                                                   }
                                                   onChange={(e) => setEditingProductDescription(e.target.value)}
                                                />
                                             </div>

                                             {/* Stock */}
                                             <div className="flex flex-col">
                                                <label
                                                   htmlFor="stock"
                                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                                >
                                                   Stock
                                                </label>
                                                <input
                                                   type="number"
                                                   name="stock"
                                                   className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                   value={
                                                      editingProductStock?.valueOf == null ? 0 : editingProductStock
                                                   }
                                                   onChange={(e) =>
                                                      setEditingProductStock(parseInt(e.target.value) || 0)
                                                   }
                                                />
                                             </div>

                                             {/* Precio */}
                                             <div className="flex flex-col">
                                                <label
                                                   htmlFor="price"
                                                   className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                                >
                                                   Precio <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                   type="number"
                                                   step="0.01"
                                                   name="price"
                                                   className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                   value={editingProdutPrice}
                                                   onChange={(event) => {
                                                      const valueWithDot = event.target.value.replace(",", ".");
                                                      setEditingProductPrice(parseFloat(valueWithDot));
                                                   }}
                                                   required
                                                />
                                             </div>

                                             {/* Categorías */}
                                             <div className="flex flex-col md:col-span-2">
                                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                   Categorías <span className="text-red-500">*</span>
                                                </label>
                                                {isLoading ? (
                                                   <p className="text-gray-400 text-sm">Cargando categorías...</p>
                                                ) : categories.length === 0 ? (
                                                   <p className="text-teal-500 text-sm font-semibold">
                                                      No hay categorías disponibles. Crea una primero.
                                                   </p>
                                                ) : (
                                                   <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700">
                                                      {categories.map((category) => (
                                                         <div
                                                            key={category.id}
                                                            className="flex items-center mb-2 last:mb-0"
                                                         >
                                                            <input
                                                               type="checkbox"
                                                               id={`category-${category.id}`}
                                                               checked={
                                                                  editingProductCategories?.includes(category.id) ||
                                                                  false
                                                               }
                                                               className="h-4 w-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                               onChange={() =>
                                                                  setEditingProductCategories((prev) => {
                                                                     if (!prev) return [category.id];
                                                                     if (prev.includes(category.id)) {
                                                                        return prev.filter((id) => id !== category.id);
                                                                     }
                                                                     return [...prev, category.id];
                                                                  })
                                                               }
                                                            />
                                                            <label
                                                               htmlFor={`category-${category.id}`}
                                                               className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                                                            >
                                                               {category.name}
                                                            </label>
                                                         </div>
                                                      ))}
                                                   </div>
                                                )}
                                             </div>

                                             {/* Imágenes actuales */}
                                             <div className="flex flex-col md:col-span-2">
                                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                   Imágenes actuales
                                                </label>
                                                {productItem.images.length === 0 ? (
                                                   <p className="text-gray-400 text-sm">No hay imágenes</p>
                                                ) : (
                                                   <div className="grid grid-cols-3 gap-2">
                                                      {productItem.images.map((image) => (
                                                         <div key={image.id} className="relative group">
                                                            <img
                                                               src={`${BASE_URL}${image.image_url}`}
                                                               alt="Product"
                                                               className="w-full h-24 object-cover rounded border border-gray-300"
                                                            />
                                                            {image.is_main && (
                                                               <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                                                                  Principal
                                                               </span>
                                                            )}
                                                            <button
                                                               type="button"
                                                               onClick={() =>
                                                                  handleDeleteProductImage(productItem.id, image.id)
                                                               }
                                                               className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                               <svg
                                                                  className="w-4 h-4"
                                                                  fill="currentColor"
                                                                  viewBox="0 0 20 20"
                                                               >
                                                                  <path
                                                                     fillRule="evenodd"
                                                                     d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                     clipRule="evenodd"
                                                                  />
                                                               </svg>
                                                            </button>
                                                         </div>
                                                      ))}
                                                   </div>
                                                )}
                                             </div>
                                             {/* Añadir nuevas imágenes */}
                                             <div className="flex flex-col md:col-span-2">
                                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                   Añadir nuevas imágenes
                                                </label>
                                                <div className="flex items-center justify-center w-full">
                                                   <label
                                                      htmlFor={`edit-images-${productItem.id}`}
                                                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                                                   >
                                                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                         <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 font-semibold">
                                                            📷 Subir imágenes
                                                         </p>
                                                         <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            PNG, JPG o WEBP
                                                         </p>
                                                      </div>
                                                      <input
                                                         id={`edit-images-${productItem.id}`}
                                                         type="file"
                                                         multiple
                                                         accept="image/*"
                                                         onChange={handleEditImageSelection}
                                                         className="hidden"
                                                      />
                                                   </label>
                                                </div>

                                                {/* Vista previa de imágenes seleccionadas */}
                                                {editingSelectedImages.length > 0 && (
                                                   <div className="mt-4">
                                                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                         {editingSelectedImages.length} imagen(es) nueva(s)
                                                         seleccionada(s)
                                                      </p>
                                                      <div className="lg:grid lg:grid-cols-3 gap-2">
                                                         {editingSelectedImages.map((image, index) => (
                                                            <div key={index} className="relative group">
                                                               <img
                                                                  src={getImagePreviewUrl(image)}
                                                                  alt={`Preview ${index + 1}`}
                                                                  className="w-full h-24 object-cover rounded border border-gray-300"
                                                               />
                                                               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                                                  {image.name}
                                                               </p>
                                                               <button
                                                                  type="button"
                                                                  onClick={() => removeEditingSelectedImage(index)}
                                                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                               >
                                                                  <svg
                                                                     className="w-4 h-4"
                                                                     fill="currentColor"
                                                                     viewBox="0 0 20 20"
                                                                  >
                                                                     <path
                                                                        fillRule="evenodd"
                                                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                                        clipRule="evenodd"
                                                                     />
                                                                  </svg>
                                                               </button>
                                                            </div>
                                                         ))}
                                                      </div>
                                                   </div>
                                                )}
                                             </div>
                                             {/* Toggle Activo */}
                                             <div className="flex items-center space-x-3 mb-4">
                                                <input
                                                   type="checkbox"
                                                   id="active-edit"
                                                   className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                   checked={editingProductIsActive || false}
                                                   onChange={(e) => setEditingProductActive(e.target.checked)}
                                                />
                                                <label
                                                   htmlFor="active"
                                                   className="text-sm font-medium text-gray-900 dark:text-white"
                                                >
                                                   ¿Mostrar producto en la tienda?
                                                </label>
                                             </div>

                                             {/* Errores */}
                                             <div className="md:col-span-2">
                                                {productSubmitError && (
                                                   <p className="text-red-500 text-sm mb-1">⚠️ {productSubmitError}</p>
                                                )}
                                                {imageUploadError && (
                                                   <p className="text-orange-500 text-sm mb-1">⚠️ {imageUploadError}</p>
                                                )}
                                             </div>

                                             {/* Botón Submit */}
                                             <button
                                                type="submit"
                                                disabled={isSubmittingProduct || isUploadingImages}
                                                className="md:col-span-2 text-white focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
                                             >
                                                {isSubmittingProduct
                                                   ? "Actualizando..."
                                                   : isUploadingImages
                                                     ? "Subiendo imágenes..."
                                                     : "Guardar producto"}
                                             </button>
                                          </form>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        );
                     })}
                     {pages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                           <button
                              disabled={page === 1}
                              onClick={() => setPage(page - 1)}
                              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                           >
                              Anterior
                           </button>

                           <span className="text-sm">
                              Página {page} de {pages}
                           </span>

                           <button
                              disabled={page === pages}
                              onClick={() => setPage(page + 1)}
                              className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                           >
                              Siguiente
                           </button>
                        </div>
                     )}
                  </div>
               )}
            </section>
         </div>
      </>
   );
}
