// ── App Router ─────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminPanel } from "../pages/admin/AdminPanel";
import { CategoriesPage } from "../pages/CategoriesPage";
import { AdminGuard } from "./AdminGuard";

export function AppRouter() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Navigate to="/categories" replace />} />
            <Route path="/categories" element={<CategoriesPage />} />
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
