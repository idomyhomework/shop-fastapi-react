// ── Store ───────────────────────────────────────────────────────────────────
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/api";
import { storefrontApi } from "../features/storefront/api";
import authReducer from "../features/auth/slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]:       authApi.reducer,
    [storefrontApi.reducerPath]: storefrontApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault()
      .concat(authApi.middleware)
      .concat(storefrontApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;