// ── App ────────────────────────────────────────────────────────────────────
import { Providers } from "./app/providers";
import { AppRouter } from "./app/router";
import { CartDrawer } from "./features/cart/CartDrawer";

function App() {
   return (
      <Providers>
         <AppRouter />
         <CartDrawer />
      </Providers>
   );
}

export default App;
