import {Header} from "./components/Header";
import { Products } from "./components/Products";
import { Users } from "./components/Users";
import { Orders } from "./components/Orders";
import { Settings } from "./components/Settings";
import "./css/admin.css";
import { useState } from "react";
import { navButtons } from "./components/constants/constants";

export function AdminPanel() {

   const [selectedSection, setSelectedSection] = useState(navButtons[0].id);

   return (
<>
         <Header 
            onChangeSection={setSelectedSection}
         />
         {selectedSection === 1 && <Products />}
         {selectedSection === 2 && <Orders />}
         {selectedSection === 3 && <Users />}
         {selectedSection === 5 && <Settings />}
      </>
   );
}
