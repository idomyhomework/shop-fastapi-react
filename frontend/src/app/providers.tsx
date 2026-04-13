// ── App Providers ──────────────────────────────────────────────────────────
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store";

export function Providers({ children }: { children: React.ReactNode }) {
   return (
      <Provider store={store}>
         {/* ── Persist Gate ────────────────────────────────────────────────── */}
         {/* Delays rendering until the persisted cart is rehydrated from localStorage */}
         <PersistGate loading={null} persistor={persistor}>
            {children}
         </PersistGate>
      </Provider>
   );
}
