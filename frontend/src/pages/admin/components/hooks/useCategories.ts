// ── useCategories Hook ───────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { categoryService } from "../services/categoryService";
import type { Category } from "../../types/category";

// ── useCategories ─────────────────────────────────────────────────────────────
export function useCategories() {
   // ── State ─────────────────────────────────────────────────────────────────
   const [categories, setCategories] = useState<Category[]>([]);
   const [isLoading, setLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   // ── Modal State ───────────────────────────────────────────────────────────
   const [modalOpen, setModalOpen] = useState(false);
   const [editingCategory, setEditingCategory] = useState<Category | null>(null);

   // ── Fetch All ─────────────────────────────────────────────────────────────
   const fetchAll = useCallback(() => {
      setLoading(true);
      categoryService
         .fetch()
         .then(setCategories)
         .catch((err: Error) => setLoadError(err.message))
         .finally(() => setLoading(false));
   }, []);

   useEffect(() => {
      fetchAll();
   }, [fetchAll]);

   // ── Open Create ───────────────────────────────────────────────────────────
   function openCreate() {
      setEditingCategory(null);
      setModalOpen(true);
   }

   // ── Open Edit ─────────────────────────────────────────────────────────────
   function openEdit(category: Category) {
      setEditingCategory(category);
      setModalOpen(true);
   }

   // ── Close Modal ───────────────────────────────────────────────────────────
   function closeModal() {
      setModalOpen(false);
      setEditingCategory(null);
   }

   // ── Handle Delete ─────────────────────────────────────────────────────────
   async function handleDelete(id: number, name: string) {
      if (!window.confirm(`¿Seguro que quieres borrar "${name}"?`)) return;
      try {
         await categoryService.delete(id);
         setCategories((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
         alert(err instanceof Error ? err.message : "Error al borrar");
      }
   }

   return {
      categories,
      isLoading,
      loadError,
      modalOpen,
      editingCategory,
      openCreate,
      openEdit,
      closeModal,
      handleDelete,
      refresh: fetchAll,
   };
}
