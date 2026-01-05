import { Header } from "./components/Header";
import { Products } from "./components/Products";
import { Users } from "./components/Users";
import { Orders } from "./components/Orders";
import { Settings } from "./components/Settings";
import { Categories } from "./components/Categories";
import "./css/admin.css";
import { useState } from "react";
import { navButtons } from "./components/constants/constants";

export function AdminPanel() {
   const [selectedSection, setSelectedSection] = useState(navButtons[0].id);

   return (
      <>
         <Header onChangeSection={setSelectedSection} />
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
