// ── Cart Slice ────────────────────────────────────────────────────────────────
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: number;
  name: string;
  price: number;        // current_price at the time of adding to cart
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

// ── Initial State ─────────────────────────────────────────────────────────────
const initialState: CartState = {
  items: [],
  isOpen: false,
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {

    // ── Add Item ──────────────────────────────────────────────────────────────
    // If the product is already in the cart, increment quantity (up to maxStock)
    addItem(state, action: PayloadAction<Omit<CartItem, "quantity">>) {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId,
      );
      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + 1,
          existing.maxStock,
        );
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },

    // ── Remove Item ───────────────────────────────────────────────────────────
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload,
      );
    },

    // ── Update Quantity ───────────────────────────────────────────────────────
    // Setting quantity to 0 removes the item
    updateQuantity(
      state,
      action: PayloadAction<{ productId: number; quantity: number }>,
    ) {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.productId !== productId);
        return;
      }
      const item = state.items.find((i) => i.productId === productId);
      if (item) {
        item.quantity = Math.min(quantity, item.maxStock);
      }
    },

    // ── Clear Cart ────────────────────────────────────────────────────────────
    clearCart(state) {
      state.items = [];
    },

    // ── Open / Close Cart Drawer ──────────────────────────────────────────────
    openCart(state) {
      state.isOpen = true;
    },

    closeCart(state) {
      state.isOpen = false;
    },

  },
});

// ── Selectors ─────────────────────────────────────────────────────────────────
// Total number of individual items (sum of all quantities)
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

// Total price of the cart
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

// ── Exports ───────────────────────────────────────────────────────────────────
export const { addItem, removeItem, updateQuantity, clearCart, openCart, closeCart } =
  cartSlice.actions;

export default cartSlice.reducer;
