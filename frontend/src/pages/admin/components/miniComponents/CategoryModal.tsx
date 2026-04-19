// ── Category Modal ───────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { categoryService } from "../services/categoryService";
import type { Category, CategoryCreate } from "../../types/category";

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   categoryToEdit?: Category | null;
   superCategories: Category[];
}

// ── Category Modal ────────────────────────────────────────────────────────────
export function CategoryModal({ isOpen, onClose, onSuccess, categoryToEdit, superCategories }: Props) {
   // ── Form state ────────────────────────────────────────────────────────────
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [isSuper, setIsSuper] = useState(false);
   const [parentId, setParentId] = useState<number | null>(null);
   const [backgroundColor, setBgColor] = useState("#FFFFFF");
   const [sortOrder, setSortOrder] = useState("0");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // ── Image state ───────────────────────────────────────────────────────────
   const [imageFile, setImageFile] = useState<File | null>(null);
   const [imagePreview, setImagePreview] = useState<string | null>(null);
   const [uploadingImage, setUploadingImage] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   // ── Computed ──────────────────────────────────────────────────────────────
   const showSubCategoryFields = !isSuper && parentId !== null;

   // ── Populate form ─────────────────────────────────────────────────────────
   useEffect(() => {
      if (categoryToEdit) {
         setName(categoryToEdit.name);
         setDescription(categoryToEdit.description ?? "");
         setIsSuper(categoryToEdit.is_super);
         setParentId(categoryToEdit.parent_id ?? null);
         setBgColor(categoryToEdit.background_color ?? "#FFFFFF");
         setSortOrder(String(categoryToEdit.sort_order ?? 0));
         setImagePreview(categoryToEdit.image_url ?? null);
      } else {
         setName("");
         setDescription("");
         setIsSuper(false);
         setParentId(null);
         setBgColor("#FFFFFF");
         setSortOrder("0");
         setImagePreview(null);
      }
      setImageFile(null);
      setError(null);
   }, [categoryToEdit, isOpen]);

   // ── Handle image file pick ────────────────────────────────────────────────
   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
   }

   // ── Handle super toggle ───────────────────────────────────────────────────
   function handleSuperToggle(checked: boolean) {
      setIsSuper(checked);
      if (checked) setParentId(null);
   }

   // ── Handle submit ─────────────────────────────────────────────────────────
   async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError(null);

      if (!name.trim()) {
         setError("El nombre es obligatorio");
         return;
      }

      const data: CategoryCreate = {
         name: name.trim(),
         description: description.trim() || null,
         is_super: isSuper,
         parent_id: isSuper ? null : parentId,
         background_color: showSubCategoryFields ? backgroundColor : null,
         sort_order: parseInt(sortOrder, 10) || 0,
      };

      try {
         setLoading(true);
         let saved: Category;
         if (categoryToEdit) {
            saved = await categoryService.edit(categoryToEdit.id, data);
         } else {
            saved = await categoryService.create(data);
         }

         // Upload image after save if a new file was picked
         if (imageFile && showSubCategoryFields) {
            setUploadingImage(true);
            await categoryService.uploadImage(saved.id, imageFile);
            setUploadingImage(false);
         }

         onSuccess();
         onClose();
      } catch (err) {
         setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
         setLoading(false);
         setUploadingImage(false);
      }
   }

   if (!isOpen) return null;

   // ── Category type label helper ────────────────────────────────────────────
   const typeLabel = isSuper ? "Super categoría" : parentId !== null ? "Sub-categoría" : "Independiente";

   return (
      <div
         className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50
 backdrop-blur-sm"
      >
         <div className="relative p-4 w-full max-w-lg">
            <div
               className="relative p-6 bg-white rounded-lg shadow dark:bg-gray-800 max-h-[90vh]
 overflow-y-auto"
            >
               {/* ── Header ─────────────────────────────────────────────── */}
               <div className="flex justify-between items-center pb-4 mb-4 border-b dark:border-gray-600">
                  <div>
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {categoryToEdit ? "Editar categoría" : "Nueva categoría"}
                     </h3>
                     <span className="text-xs text-gray-400">{typeLabel}</span>
                  </div>
                  <button
                     type="button"
                     onClick={onClose}
                     className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg  
 text-sm p-1.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white shadow-none"
                  >
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                           fillRule="evenodd"
                           d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0    
 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10  
 4.293 5.707a1 1 0 010-1.414z"
                           clipRule="evenodd"
                        />
                     </svg>
                  </button>
               </div>

               {/* ── Form ───────────────────────────────────────────────── */}
               <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* ── Name ─────────────────────────────────────────────── */}
                  <div className="flex flex-col gap-1">
                     <label
                        htmlFor="cat-name"
                        className="text-sm font-medium text-gray-900
 dark:text-white"
                     >
                        Nombre *
                     </label>
                     <input
                        id="cat-name"
                        type="text"
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg   
 focus:ring-violet-500 focus:border-violet-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                     />
                  </div>

                  {/* ── Description ──────────────────────────────────────── */}
                  <div className="flex flex-col gap-1">
                     <label
                        htmlFor="cat-desc"
                        className="text-sm font-medium text-gray-900
 dark:text-white"
                     >
                        Descripción
                     </label>
                     <textarea
                        id="cat-desc"
                        rows={2}
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg   
 focus:ring-violet-500 focus:border-violet-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                     />
                  </div>

                  {/* ── Sort Order ────────────────────────────────────────── */}
                  <div className="flex flex-col gap-1">
                     <label
                        htmlFor="cat-sort"
                        className="text-sm font-medium text-gray-900
 dark:text-white"
                     >
                        Orden
                     </label>
                     <input
                        id="cat-sort"
                        type="number"
                        min={0}
                        className="w-24 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg     
 focus:ring-violet-500 focus:border-violet-500 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={sortOrder}
                        onChange={(e) => {
                           const raw = e.target.value.replace(/\D/g, "");
                           setSortOrder(raw === "" ? "0" : String(parseInt(raw, 10)));
                        }}
                     />
                  </div>

                  {/* ── Is Super Toggle ───────────────────────────────────── */}
                  <div className="flex items-center gap-3">
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input
                           type="checkbox"
                           className="sr-only peer"
                           checked={isSuper}
                           onChange={(e) => handleSuperToggle(e.target.checked)}
                        />
                        <div
                           className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-violet-600      
 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 
  after:w-5 after:transition-all peer-checked:after:translate-x-full"
                        />
                     </label>
                     <span className="text-sm font-medium text-gray-900 dark:text-white">Super categoría</span>
                  </div>

                  {/* ── Parent Category (only when not super) ─────────────── */}
                  {!isSuper && (
                     <div className="flex flex-col gap-1">
                        <label
                           htmlFor="cat-parent"
                           className="text-sm font-medium text-gray-900
 dark:text-white"
                        >
                           Categoría padre
                        </label>
                        <select
                           id="cat-parent"
                           className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm
 rounded-lg focus:ring-violet-500 focus:border-violet-500 p-2.5 dark:bg-gray-700 dark:border-gray-600
 dark:text-white"
                           value={parentId ?? ""}
                           onChange={(e) => setParentId(e.target.value === "" ? null : Number(e.target.value))}
                        >
                           <option value="">— Independiente —</option>
                           {superCategories.map((sc) => (
                              <option key={sc.id} value={sc.id}>
                                 {sc.name}
                              </option>
                           ))}
                        </select>
                     </div>
                  )}

                  {/* ── Sub-category fields (only when parent selected) ───── */}
                  {showSubCategoryFields && (
                     <>
                        {/* ── Background Color ─────────────────────────────── */}
                        <div className="flex flex-col gap-1">
                           <label
                              htmlFor="cat-color"
                              className="text-sm font-medium text-gray-900
 dark:text-white"
                           >
                              Color de fondo
                           </label>
                           <div className="flex items-center gap-3">
                              <input
                                 id="cat-color"
                                 type="color"
                                 className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                 value={backgroundColor}
                                 onChange={(e) => setBgColor(e.target.value)}
                              />
                              <span className="text-sm text-gray-500 font-mono">{backgroundColor}</span>
                           </div>
                        </div>

                        {/* ── Image Upload ──────────────────────────────────── */}
                        <div className="flex flex-col gap-1">
                           <label className="text-sm font-medium text-gray-900 dark:text-white">Imagen</label>
                           <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col   
 items-center gap-2 cursor-pointer hover:border-violet-400 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                 e.preventDefault();
                                 const file = e.dataTransfer.files?.[0];
                                 if (file) {
                                    setImageFile(file);
                                    setImagePreview(URL.createObjectURL(file));
                                 }
                              }}
                           >
                              {imagePreview ? (
                                 <img src={imagePreview} alt="preview" className="h-24 object-contain rounded" />
                              ) : (
                                 <span className="text-sm text-gray-400">Arrastra una imagen o haz clic</span>
                              )}
                           </div>
                           <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={handleFileChange}
                           />
                        </div>
                     </>
                  )}

                  {/* ── Error ─────────────────────────────────────────────── */}
                  {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg py-2 px-3">⚠️ {error}</p>}

                  {/* ── Submit ────────────────────────────────────────────── */}
                  <button
                     type="submit"
                     disabled={loading || uploadingImage}
                     className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg     
 text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {uploadingImage
                        ? "Subiendo imagen..."
                        : loading
                          ? "Guardando..."
                          : categoryToEdit
                            ? "Guardar cambios"
                            : "Crear categoría"}
                  </button>
               </form>
            </div>
         </div>
      </div>
   );
}
