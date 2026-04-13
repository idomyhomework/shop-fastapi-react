// ── Product Page ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import type { Product } from "./admin/types/product";
import { BASE_URL } from "../config";

// ── Product Page ──────────────────────────────────────────────────────────────
export function ProductPage() {
   // ── State ─────────────────────────────────────────────────────────────────
   const [products, setProducts] = useState<Product[]>([]);
   const [isLoading, setLoading] = useState<boolean>(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   // ── Fetch Products ────────────────────────────────────────────────────────
   useEffect(() => {
      async function fetchProducts() {
         try {
            const response = await fetch(`${BASE_URL}/store/products`);
            if (!response.ok) {
               throw new Error("Error al cargar los productos");
            }
            const productsData: { items: Product[] } = await response.json();
            setProducts(productsData.items);
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
      fetchProducts();
   }, []);

   if (isLoading) {
      return <p>Cargando los productos...</p>;
   }

   if (loadError) {
      return <p>Error al cargar los productos: {loadError}</p>;
   }

   return (
      <div>
         <h1>Lista de productos:</h1>
         <ul>
            {products.map((item) => (
               <li key={item.id}>
                  {item.name} - {item.price} $
               </li>
            ))}
         </ul>
      </div>
   );
}
