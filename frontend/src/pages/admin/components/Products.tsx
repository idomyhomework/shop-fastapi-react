import { useEffect, useState } from "react";
import CloseIcon from "./img/close.svg";
import type { FormEvent, ChangeEvent } from "react";
import type { Category, CategoryCreate } from "../types/category";
import type { ProductCreate, Product, ProductImage } from "../types/product";

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

   function startEditingProduct(product: Product) {
      setEditingProductId(product.id);
      setEditingProductName(product.name);
      setEditingProductDescription(product.description);
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
         const response = await fetch(`${BASE_URL}/products`);
         if (!response.ok) {
            throw new Error("Error while fetching categories");
         }
         const productData: Product[] = await response.json();
         setProducts(productData);
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
         setSelectedImages(filesArray);
      }
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

   async function handleEditProduct(productId: number) {}

   async function handleDeleteProduct(productToDeleteId: number, productToDeleteName: string) {
      const userConfirmed = window.confirm(`¿Seguro que quieres borrar el producto "${productToDeleteName}"?`);
      if (!userConfirmed) {
         return;
      }
      try {
         setIsDeletingProduct(true);
         const response = await fetch(`${BASE_URL}/categories/${productToDeleteId}`, {
            method: "DELETE",
         });
         if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const detail = errorBody?.detail ?? "Error al borrar la categoría en el servidor";
            throw new Error(detail);
         }
         setCategories((previousCategories) =>
            previousCategories.filter((categoryItem) => categoryItem.id !== productToDeleteId)
         );
         alert("La categoria fue eliminada correctamente");
      } catch (error) {
         if (error instanceof Error) {
            setProductSubmitError(error.message);
         } else {
            setProductSubmitError("Error desconocido al borrar la categoria");
         }
      } finally {
         setIsDeletingProduct(false);
      }
   }

   function handleClickEditProduct(product: Product) {
      startEditingProduct(product);
      setEditingProductId(product.id);
   }

   return (
      <>
         <div id="admin" className="lg:grid lg:grid-cols-2 w-9/12 mx-auto py-8">
            <section id="products">
               <h3 className="mb-2">Crear nuevo producto</h3>
               <form onSubmit={handleCreateProduct}>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="name">
                        Nombre:<span className="requiered">*</span>
                     </label>
                     <input
                        type="text"
                        value={newProductName}
                        name="name"
                        onChange={(e) => setNewProductName(e.target.value)}
                     />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="description">Descripción:</label>
                     <input
                        type="text"
                        name="description"
                        value={newProductDescription}
                        onChange={(e) => setNewProductDescription(e.target.value)}
                     />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="price">
                        Código de barras<span className="requiered">*</span>
                     </label>
                     <input
                        type="text"
                        name="bar_code"
                        value={newProductBarCode}
                        onChange={(e) => setNewProductBarCode(e.target.value)}
                     />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="stock">Stock</label>
                     <input
                        type="number"
                        name="stock"
                        value={newProductStock}
                        className="w-24"
                        onChange={(e) => setNewProductStock(parseInt(e.target.value) || 0)}
                     />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="price">
                        Precio <span className="requiered">*</span>
                     </label>
                     <input
                        type="number"
                        step="0.01"
                        name="price"
                        className="w-24"
                        value={newProductPrice}
                        onChange={(event) => {
                           const valueWithDot = event.target.value.replace(",", "."); // coma → punto
                           setNewProductPrice(parseFloat(valueWithDot));
                        }}
                     />
                  </div>
                  <div className="mb-2 flex flex-col">
                     <label htmlFor="stock">
                        Categorías<span className="requiered">*</span>
                     </label>
                     {isLoading ? (
                        <p>Cargando categorías...</p>
                     ) : categories.length === 0 ? (
                        <p className="text-teal-300">No hay categorías disponibles. Crea una primero.</p>
                     ) : (
                        <div className="border border-teal-300 rounded-md p-3 max-h-48 max-w-80 overflow-y-auto">
                           {categories.map((category) => (
                              <div key={category.id} className="flex items-center mb-6">
                                 <input
                                    type="checkbox"
                                    id={`category-${category.id}`}
                                    checked={selectedCategoryIds.includes(category.id)}
                                    className="h-4 w-4 mr-2 mt-2"
                                    onChange={() => handleCategoryToggle(category.id)}
                                 />
                                 <label htmlFor={`category-${category.id}`} className="cursor-pointer h-4">
                                    {category.name}
                                 </label>
                              </div>
                           ))}
                        </div>
                     )}
                     {selectedCategoryIds.length > 0 && <p>Seleccionadas: {selectedCategoryIds.length}</p>}
                  </div>
                  <div className="mb-4 flex flex-col">
                     <label>
                        Imagenes del producto<span className="requiered">*</span>
                     </label>
                     {/* Label que actúa como botón */}
                     <label htmlFor="images" className="btn-file-upload w-fit">
                        📷 Seleccionar imágenes
                     </label>
                     <input
                        id="images"
                        name="images"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,.jpg,.jpeg,.png,.webp"
                        onChange={handleImageSelection}
                        className="hidden"
                     />
                     {selectedImages.length > 0 && (
                        <p className="text-sm text-grey-400 mt-1">
                           Imagenes seleccionadas: {selectedImages.length}. La primera imagen será la imagen principal{" "}
                           <br />
                           Si abres el boton otra vez, las imagenes que seleccionaste antes se borrarán
                        </p>
                     )}
                  </div>
                  <div className="mb-4 flex flex-col">
                     <label htmlFor="active">Mostrar el producto?</label>
                     <input
                        type="checkbox"
                        name="active"
                        className="h-8 w-8"
                        checked={newProductIsActive}
                        onChange={(e) => setNewProductIsActive(e.target.checked)}
                     />
                  </div>
                  {productSubmitError && <p className="text-red-400 mb-2">{productSubmitError}</p>}
                  {imageUploadError && <p className="text-orange-400 mb-2">{imageUploadError}</p>}
                  <button type="submit" disabled={isSubmittingProduct || isUploadingImages} className="mb-8">
                     {isSubmittingProduct
                        ? "Creando producto..."
                        : isUploadingImages
                          ? "Subiendo imágenes..."
                          : "Crear producto"}
                  </button>
               </form>
            </section>
            <section>
               <h3>✏️ Editar producto</h3>
               {productsLoading ? (
                  <p>{loadProductsMessage}</p>
               ) : products.length === 0 ? (
                  <p className="text-teal-300">No hay productos disponibles. Crea uno primero. </p>
               ) : (
                  <div>
                     {products.map((productItem) => {
                        // We look for the image that has is_main set to true
                        const mainProductImage = productItem.images.find((image) => image.is_main === true);

                        return (
                           <div
                              key={productItem.id}
                              className="border border-teal-300 rounded-md p-4 mb-1 flex items-center gap-4"
                           >
                              {mainProductImage ? (
                                 <img
                                    src={`${BASE_URL}${mainProductImage.image_url}`}
                                    alt={productItem.name}
                                    className="w-16 h-16 object-cover rounded"
                                 />
                              ) : (
                                 <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">
                                    <span>No image</span>
                                 </div>
                              )}

                              <div className="flex-1">
                                 <p className="font-bold">{productItem.name}</p>
                                 <div className="flex">
                                    <p className="text-sm text-gray-400">${productItem.price}</p>
                                 </div>
                              </div>
                              <div className="flex w-30 justify-between">
                                 <button onClick={() => handleClickEditProduct(productItem)}>Editar</button>
                                 <button
                                    onClick={() => handleDeleteProduct(productItem.id, productItem.name)}
                                    className="btn-category-delete ml-2"
                                 >
                                    <img className="category-delete-icon block w-4" src={CloseIcon} alt="Delete" />
                                 </button>
                              </div>
                              {editingProductId == productItem.id && (
                                 <div
                                    id="updateProductModal"
                                    aria-hidden="false"
                                    className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50"
                                 >
                                    <div className="relative p-4 w-full max-w-2xl">
                                       <div className="relative p-4 bg-white rounded-lg shadow dark:bg-gray-800 sm:p-5">
                                          <div className="flex justify-between items-center pb-4 mb-4 rounded-t border-b sm:mb-5 dark:border-gray-600">
                                             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Editar Producto
                                             </h3>
                                             <button
                                                type="button"
                                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                                data-modal-toggle="updateProductModal"
                                                onClick={() => {
                                                   setEditingProductId(null);
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
                                                handleEditProduct(productItem.id);
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
                                                      value={editingProductName}
                                                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                      placeholder="Ex. Apple iMac 27&ldquo;"
                                                      onChange={(e) => {
                                                         setEditingProductName(e.target.value);
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
                                                      value=""
                                                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                      placeholder=""
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
                                                      value={
                                                         editingProductDescription ? editingProductDescription : " "
                                                      }
                                                      className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                                      placeholder="Write a description..."
                                                      onChange={(e) => setEditingProductDescription(e.target.value)}
                                                   ></textarea>
                                                </div>
                                             </div>
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
                        );
                     })}
                  </div>
               )}
            </section>
         </div>
      </>
   );
}
