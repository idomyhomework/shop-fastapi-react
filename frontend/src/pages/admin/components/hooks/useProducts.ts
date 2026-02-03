import { useState, useEffect, useCallback } from "react";
import { productServices } from "../services/productService";
import type { Product, ProductFilters, ProductListResponse } from "../../types/product";
import type { Category } from "../../types/category";

export function useProducts() {
   // Estados de Listado
   const [products, setProducts] = useState<Product[]>([]);
   const [categories, setCategories] = useState<Category[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Estados de Paginación y Filtros
   const [page, setPage] = useState(1);
   const [pageSize, setPageSize] = useState(25);
   const [total, setTotal] = useState(0);
   const [pages, setPages] = useState(1);
   const [filters, setFilters] = useState<ProductFilters>({
      name: "",
      bar_code: "",
      stock: "",
      price: "",
      active: "all",
      categoryId: "",
   });

   // Cargar Categorías al inicio
   useEffect(() => {
      productServices
         .fetchCategories()
         .then(setCategories)
         .catch((err) => setError(err.message));
   }, []);

   // Cargar Productos (con debounce para filtros)
   const fetchProducts = useCallback(async () => {
      setLoading(true);
      try {
         const params = new URLSearchParams();
         if (filters.name.trim()) params.set("q", filters.name.trim());
         if (filters.bar_code.trim()) params.set("bar_code", filters.bar_code.trim());
         if (filters.stock !== "") params.set("stock", filters.stock);
         if (filters.price !== "") params.set("price", filters.price.replace(",", "."));
         if (filters.active !== "all") params.set("is_active", String(filters.active === "active"));
         if (filters.categoryId) params.set("category_id", filters.categoryId);

         params.set("page", String(page));
         params.set("page_size", String(pageSize));

         const data = await productServices.fetchProducts(params);
         setProducts(data.items);
         setTotal(data.total);
         setPages(data.pages);
      } catch (err: any) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   }, [filters, page, pageSize]);

   useEffect(() => {
      const timer = setTimeout(fetchProducts, 300);
      return () => clearTimeout(timer);
   }, [fetchProducts]);

   // Acciones de Producto
   const handleDelete = async (id: number, name: string) => {
      if (!window.confirm(`¿Seguro que quieres borrar "${name}"?`)) return;
      try {
         await productServices.deleteProduct(id);
         setProducts((prev) => prev.filter((p) => p.id !== id));
         alert("Producto eliminado");
      } catch (err: any) {
         alert(err.message);
      }
   };

   const handleToggleActive = async (id: number) => {
      try {
         const data = await productServices.toggleActive(id);
         setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: data.is_active } : p)));
      } catch (err: any) {
         alert(err.message);
      }
   };

   return {
      products,
      categories,
      loading,
      error,
      filters,
      setFilters,
      page,
      setPage,
      pages,
      total,
      handleDelete,
      handleToggleActive,
      refresh: fetchProducts,
      pageSize,
      setPageSize,
   };
}
