import { CategoriesPage } from "./pages/CategoriesPage";
import "./App.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminPanel } from "./pages/admin/AdminPanel";

function App() {
   return (
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<Navigate to={"/categories"} replace />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/admin" element={<AdminPanel />} />
         </Routes>
      </BrowserRouter>
   );
}

export default App;
