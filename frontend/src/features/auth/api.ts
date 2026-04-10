// ── Auth API ───────────────────────────────────────────────────────────────

import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../config";
import type { User, LoginRequest, RegisterRequest } from "./types";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
        credentials: "include",
    }),
    endpoints: (builder) => ({
        getMe: builder.query<User, void>({
            query: () => "auth/me",
        }),
        register: builder.mutation<User, RegisterRequest>({
            query: (body) => ({url: "/auth/register", method: "POST", body}),
        }),
        login: builder.mutation<User, LoginRequest>({
            query: (body) => ({ url: "/auth/login", method: "POST", body}),
        }),
        logout: builder.mutation<void, void>({
            query: () => ({ url: "/auth/logout", method: "POST" }),
        }),
    }),
});

export const {
    useGetMeQuery,
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation
} = authApi;