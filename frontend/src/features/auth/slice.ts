// ── Auth Slice ─────────────────────────────────────────────────────────────

import {createSlice} from "@reduxjs/toolkit";
import type { User } from "./types";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
};

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        // ── Set User ───────────────────────────────────────────────────────────
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        // ── Clear User ─────────────────────────────────────────────────────────
        clearUser: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
});

export const {setUser, clearUser} = authSlice.actions;
export default authSlice.reducer;      