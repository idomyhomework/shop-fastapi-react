// ── Auth API ───────────────────────────────────────────────────────────────

import {
   createApi,
   fetchBaseQuery,
   type BaseQueryFn,
   type FetchArgs,
   type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../config";
import { clearUser } from "./slice";
import type { User, LoginRequest, RegisterRequest } from "./types";

// ── Base Query ────────────────────────────────────────────────────────────────
const baseQuery = fetchBaseQuery({
   baseUrl: BASE_URL,
   credentials: "include",
});

// ── Base Query With Reauth ────────────────────────────────────────────────────
// On a 401 response, attempts POST /auth/refresh to rotate the access_token
// cookie, then retries the original request once. If the refresh also fails,
// the user is cleared from Redux and the login modal reappears.
const baseQueryWithReauth: BaseQueryFn<
   string | FetchArgs,
   unknown,
   FetchBaseQueryError
> = async (args, api, extraOptions) => {
   // ── Initial Request ───────────────────────────────────────────────────────
   let result = await baseQuery(args, api, extraOptions);

   if (result.error?.status !== 401) return result;

   // ── Attempt Token Refresh ─────────────────────────────────────────────────
   const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
   );

   if (refreshResult.data) {
      // ── Retry Original Request ────────────────────────────────────────────
      result = await baseQuery(args, api, extraOptions);
   } else {
      // Refresh failed — show login modal
      api.dispatch(clearUser());
   }

   return result;
};

// ── Auth API Slice ────────────────────────────────────────────────────────────
export const authApi = createApi({
   reducerPath: "authApi",
   baseQuery: baseQueryWithReauth,
   endpoints: (builder) => ({
      // ── Get Me ───────────────────────────────────────────────────────────
      getMe: builder.query<User, void>({
         query: () => "auth/me",
      }),
      // ── Register ─────────────────────────────────────────────────────────
      register: builder.mutation<User, RegisterRequest>({
         query: (body) => ({ url: "/auth/register", method: "POST", body }),
      }),
      // ── Login ────────────────────────────────────────────────────────────
      login: builder.mutation<User, LoginRequest>({
         query: (body) => ({ url: "/auth/login", method: "POST", body }),
      }),
      // ── Logout ───────────────────────────────────────────────────────────
      logout: builder.mutation<void, void>({
         query: () => ({ url: "/auth/logout", method: "POST" }),
      }),
   }),
});

// ── Exports ──────────────────────────────────────────────────────────────────
export const {
   useGetMeQuery,
   useRegisterMutation,
   useLoginMutation,
   useLogoutMutation,
} = authApi;
