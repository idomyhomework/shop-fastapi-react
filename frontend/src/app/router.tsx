// ── App Router ─────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminPanel } from "../pages/admin/AdminPanel";
import { ProductPage } from "../pages/ProductPage";
import { SingleProductPage } from "../pages/SingleProduct";
import { CategoriesPage } from "../pages/CategoriesPage";
import { AdminGuard } from "./AdminGuard";

export function AppRouter() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Navigate to="/productos" replace />} />
            <Route path="/productos" element={<ProductPage />} />
            <Route path="/productos/:id" element={<SingleProductPage />} />
            <Route path="/categorias" element={<CategoriesPage />} />
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
