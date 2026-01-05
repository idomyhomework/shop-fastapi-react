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

   useEffect(() => {
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
                     {products.map((item) => (
                        <h4>
                           {item.name} <span>📝 Stock:{item.stock_quantity} </span>
                           <span> price: {item.price}</span>
                           <button
                              onClick={() => handleDeleteProduct(item.id, item.name)}
                              className="btn-category-delete"
                           >
                              <img className="category-delete-icon" src={`${CloseIcon}`} />
                           </button>
                        </h4>
                     ))}
                  </div>
               )}
            </section>
         </div>
      </>
   );
}
