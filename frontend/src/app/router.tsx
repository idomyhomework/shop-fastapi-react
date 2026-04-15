// ── App Router ─────────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminPanel } from "../pages/admin/AdminPanel";
import { HomePage } from "../pages/HomePage";
import { CatalogPage } from "../pages/CatalogPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { AdminGuard } from "./AdminGuard";

// ── Router ─────────────────────────────────────────────────────────────────────
export function AppRouter() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route
               path="/admin/*"
               element={
                  <AdminGuard>
                     <AdminPanel />
                  </AdminGuard>
               }
            />
         </Routes>
      </BrowserRouter>
   );
}
