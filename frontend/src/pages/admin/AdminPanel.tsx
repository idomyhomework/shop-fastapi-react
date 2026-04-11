// ── Admin Panel ──────────────────────────────────────────────────────────────
import { Header } from "./components/Header";
import { Products } from "./components/Products";
import { Users } from "./components/Users";
import { Orders } from "./components/Orders";
import { Settings } from "./components/Settings";
import { Categories } from "./components/Categories";
import { useState } from "react";
import { navButtons } from "./components/constants/constants";

// ── Admin Panel ───────────────────────────────────────────────────────────────
export function AdminPanel() {
   // ── State ─────────────────────────────────────────────────────────────────
   const [selectedSection, setSelectedSection] = useState(navButtons[0].id);

   return (
      <>
         {/* ── Header ──────────────────────────────────────────────────────── */}
         <Header onChangeSection={setSelectedSection} />

         {/* ── Section Router ──────────────────────────────────────────────── */}
         <div className="admin-section-container" key={selectedSection}>
            {selectedSection === 1 && <Products />}
            {selectedSection === 2 && <Categories />}
            {selectedSection === 3 && <Orders />}
            {selectedSection === 4 && <Users />}
            {selectedSection === 6 && <Settings />}
         </div>
      </>
   );
}
