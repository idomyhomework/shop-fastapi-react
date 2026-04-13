// ── Single Product Page ──────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Product } from "./admin/types/product";
import { BASE_URL } from "../config";

// ── Single Product Page ───────────────────────────────────────────────────────
export function SingleProductPage() {
   // ── State ─────────────────────────────────────────────────────────────────
   const { id } = useParams<{ id: string }>();
   const [product, setProduct] = useState<Product | null>(null);
   const [isLoading, setLoading] = useState<boolean>(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   // ── Fetch Product ─────────────────────────────────────────────────────────
   useEffect(() => {
      async function fetchProduct() {
         try {
            const response = await fetch(`${BASE_URL}/store/products/${id}`);
            if (!response.ok) {
               throw new Error("Error al cargar el producto");
            }
            const productData: Product = await response.json();
            setProduct(productData);
         } catch (error) {
            if (error instanceof Error) {
               setLoadError(error.message);
            } else {
               setLoadError("Unknown error");
            }
         } finally {
            setLoading(false);
         }
      }
      fetchProduct();
   }, [id]);

   // ── Loading & Error States ────────────────────────────────────────────────
   if (isLoading) {
      return <p>Cargando el producto...</p>;
   }

   if (loadError) {
      return <p>Error al cargar el producto: {loadError}</p>;
   }

   if (!product) {
      return <p>Producto no encontrado.</p>;
   }

   // ── Render ────────────────────────────────────────────────────────────────
   return (
      <div>
         <h1>{product.name}</h1>
         <p>{product.price} $</p>
      </div>
   );
}
