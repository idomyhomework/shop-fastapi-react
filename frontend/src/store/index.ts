// ── Store ───────────────────────────────────────────────────────────────────
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { authApi } from "../features/auth/api";
import { storefrontApi } from "../features/storefront/api";
import authReducer from "../features/auth/slice";
import cartReducer from "../features/cart/slice";

// ── Persist Config ────────────────────────────────────────────────────────────
// Only the cart is persisted to localStorage — auth and API caches are ephemeral
const cartPersistConfig = {
  key: "cart",
  storage,
  whitelist: ["items"],   // isOpen is not persisted — drawer always starts closed
};

// ── Root Reducer ──────────────────────────────────────────────────────────────
const rootReducer = combineReducers({
  auth:                          authReducer,
  cart:                          persistReducer(cartPersistConfig, cartReducer),
  [authApi.reducerPath]:         authApi.reducer,
  [storefrontApi.reducerPath]:   storefrontApi.reducer,
});

// ── Store ─────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({
      // Ignore redux-persist action types in serializability checks
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
      .concat(authApi.middleware)
      .concat(storefrontApi.middleware),
});

// ── Persistor ─────────────────────────────────────────────────────────────────
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;