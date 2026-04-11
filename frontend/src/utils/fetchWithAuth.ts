// ── Fetch With Auth ───────────────────────────────────────────────────────────
// Wraps fetch with automatic token refresh. On a 401 response it calls
// POST /auth/refresh (which rotates the access_token cookie), then retries
// the original request once. If the refresh also fails the user is logged out.

import { BASE_URL } from "../config";
import { store } from "../store";
import { clearUser } from "../features/auth/slice";

// ── fetchWithAuth ─────────────────────────────────────────────────────────────
export async function fetchWithAuth(
   input: RequestInfo | URL,
   init?: RequestInit,
): Promise<Response> {
   // ── Initial Request ───────────────────────────────────────────────────────
   const response = await fetch(input, { ...init, credentials: "include" });

   if (response.status !== 401) return response;

   // ── Attempt Token Refresh ─────────────────────────────────────────────────
   const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
   });

   if (!refreshResponse.ok) {
      // Refresh failed — clear Redux state so AdminGuard shows the login modal
      store.dispatch(clearUser());
      return response;
   }

   // ── Retry Original Request ────────────────────────────────────────────────
   return fetch(input, { ...init, credentials: "include" });
}
